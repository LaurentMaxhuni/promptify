import getSystemPrompt from "./lib/promptify-system-prompt.js";

const API_PATH = "/api/groq";
const DEFAULT_EXTENSION_ORIGIN = "chrome-extension://egbcpmegonokjknlibpddibiocjfoggg";
const FRAMEWORKS = new Set([
  "CREO",
  "RACE",
  "CARE",
  "APE",
  "RISE",
  "TAG",
  "COAST",
  "CREATE",
]);

const DEFAULTS = {
  maxPromptChars: 12_000,
  maxRequestBytes: 64_000,
  maxResponseBytes: 1_000_000,
  upstreamTimeoutMs: 30_000,
  perClientDailyQuota: 30,
  globalDailyQuota: 1_000,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsOrigin = getCorsOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (request.headers.get("Origin") && !corsOrigin) {
        return errorResponse("ORIGIN_NOT_ALLOWED", "Origin is not allowed.", 403);
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin),
      });
    }

    if (url.pathname !== API_PATH) {
      return new Response("Not Found", { status: 404 });
    }

    if (request.headers.get("Origin") && !corsOrigin) {
      return errorResponse("ORIGIN_NOT_ALLOWED", "Origin is not allowed.", 403);
    }

    if (request.method !== "POST") {
      return errorResponse(
        "METHOD_NOT_ALLOWED",
        "Use POST with a JSON request body.",
        405,
        { Allow: "POST, OPTIONS" },
      );
    }

    const authError = await authenticate(request, env);
    if (authError) {
      return errorResponse(authError.code, authError.message, authError.status, {}, corsOrigin);
    }

    if (!env.GROQ_API_KEY) {
      return errorResponse(
        "SERVICE_NOT_CONFIGURED",
        "The enhancement service is not configured.",
        503,
        {},
        corsOrigin,
      );
    }

    const bodyResult = await readRequestBody(request, env);
    if (!bodyResult.ok) {
      return errorResponse(bodyResult.code, bodyResult.message, bodyResult.status, {}, corsOrigin);
    }

    const prompt = bodyResult.body.prompt.trim();
    if (!prompt) {
      return errorResponse("MISSING_PROMPT", "Prompt is required.", 400, {}, corsOrigin);
    }

    const maxPromptChars = getPositiveInteger(env.MAX_PROMPT_CHARS, DEFAULTS.maxPromptChars);
    if (prompt.length > maxPromptChars) {
      return errorResponse(
        "PROMPT_TOO_LONG",
        `Prompt must be ${maxPromptChars.toLocaleString()} characters or fewer.`,
        413,
        {},
        corsOrigin,
      );
    }

    const frameworkResult = normalizeFramework(bodyResult.body.framework);
    if (!frameworkResult.ok) {
      return errorResponse(frameworkResult.code, frameworkResult.message, 400, {}, corsOrigin);
    }

    const clientKey = await getClientKey(request);
    const rateLimitError = await checkRateLimit(env, clientKey);
    if (rateLimitError) {
      return errorResponse(
        rateLimitError.code,
        rateLimitError.message,
        rateLimitError.status,
        { "Retry-After": "60" },
        corsOrigin,
      );
    }

    const quotaError = await consumeQuota(env, clientKey);
    if (quotaError) {
      return errorResponse(
        quotaError.code,
        quotaError.message,
        quotaError.status,
        { "Retry-After": "3600" },
        corsOrigin,
      );
    }

    const systemPrompt = getSystemPrompt(frameworkResult.value);
    let upstreamResponse;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      getPositiveInteger(env.UPSTREAM_TIMEOUT_MS, DEFAULTS.upstreamTimeoutMs),
    );

    try {
      upstreamResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const code = error?.name === "AbortError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE";
      const message =
        code === "UPSTREAM_TIMEOUT"
          ? "The enhancement service took too long to respond."
          : "The enhancement service is temporarily unavailable.";
      return errorResponse(code, message, 502, {}, corsOrigin);
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await upstreamResponse.text();
    const maxResponseBytes = getPositiveInteger(env.MAX_RESPONSE_BYTES, DEFAULTS.maxResponseBytes);
    if (new TextEncoder().encode(responseText).byteLength > maxResponseBytes) {
      return errorResponse(
        "UPSTREAM_RESPONSE_TOO_LARGE",
        "The enhancement service returned an oversized response.",
        502,
        {},
        corsOrigin,
      );
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return errorResponse(
        "UPSTREAM_INVALID_RESPONSE",
        "The enhancement service returned an invalid response.",
        502,
        {},
        corsOrigin,
      );
    }

    if (!upstreamResponse.ok) {
      const isRateLimited = upstreamResponse.status === 429;
      return errorResponse(
        isRateLimited ? "UPSTREAM_RATE_LIMITED" : "UPSTREAM_ERROR",
        isRateLimited
          ? "The enhancement service is rate-limited. Please try again later."
          : "The enhancement service returned an error.",
        isRateLimited ? 429 : 502,
        {},
        corsOrigin,
      );
    }

    return jsonResponse(data, 200, corsOrigin);
  },
};

export class PromptifyQuota {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const clientKey = typeof body.clientKey === "string" ? body.clientKey : "unknown";
    const clientLimit = getPositiveInteger(body.clientLimit, DEFAULTS.perClientDailyQuota);
    const globalLimit = getPositiveInteger(body.globalLimit, DEFAULTS.globalDailyQuota);
    const date = new Date().toISOString().slice(0, 10);
    const current = (await this.state.storage.get("daily")) || {
      date,
      total: 0,
      clients: {},
    };

    const record = current.date === date ? current : { date, total: 0, clients: {} };
    const clientCount = Number(record.clients[clientKey] || 0);
    if (record.total >= globalLimit || clientCount >= clientLimit) {
      return Response.json({ allowed: false });
    }

    record.total += 1;
    record.clients[clientKey] = clientCount + 1;
    await this.state.storage.put("daily", record);

    return Response.json({ allowed: true });
  }
}

async function authenticate(request, env) {
  const expectedToken = String(env.PROMPTIFY_API_TOKEN || "").trim();
  if (!expectedToken) {
    return {
      code: "AUTH_NOT_CONFIGURED",
      message: "Service authentication is not configured.",
      status: 503,
    };
  }

  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match || !timingSafeEqual(match[1].trim(), expectedToken)) {
    return {
      code: "UNAUTHORIZED",
      message: "A valid access token is required.",
      status: 401,
    };
  }

  return null;
}

async function readRequestBody(request, env) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Content-Type must be application/json.",
      status: 415,
    };
  }

  const contentLength = Number(request.headers.get("Content-Length"));
  const maxRequestBytes = getPositiveInteger(env.MAX_REQUEST_BYTES, DEFAULTS.maxRequestBytes);
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return {
      ok: false,
      code: "REQUEST_TOO_LARGE",
      message: "Request body is too large.",
      status: 413,
    };
  }

  let text;
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      code: "INVALID_REQUEST",
      message: "Request body could not be read.",
      status: 400,
    };
  }

  if (new TextEncoder().encode(text).byteLength > maxRequestBytes) {
    return {
      ok: false,
      code: "REQUEST_TOO_LARGE",
      message: "Request body is too large.",
      status: 413,
    };
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      status: 400,
    };
  }

  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.prompt !== "string") {
    return {
      ok: false,
      code: "INVALID_REQUEST",
      message: "Request body must include a string prompt.",
      status: 400,
    };
  }

  return { ok: true, body };
}

function normalizeFramework(value) {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: "" };
  }

  if (typeof value !== "string") {
    return {
      ok: false,
      code: "INVALID_FRAMEWORK",
      message: "Framework must be a string.",
    };
  }

  const framework = value.trim().toUpperCase();
  if (!framework) return { ok: true, value: "" };
  if (!FRAMEWORKS.has(framework)) {
    return {
      ok: false,
      code: "INVALID_FRAMEWORK",
      message: "The selected framework is not supported.",
    };
  }

  return { ok: true, value: framework };
}

async function checkRateLimit(env, clientKey) {
  if (!env.RATE_LIMITER) {
    return {
      code: "RATE_LIMIT_NOT_CONFIGURED",
      message: "Rate limiting is not configured.",
      status: 503,
    };
  }

  try {
    const result = await env.RATE_LIMITER.limit({ key: clientKey });
    if (!result.success) {
      return {
        code: "RATE_LIMITED",
        message: "Too many enhancement requests. Please try again shortly.",
        status: 429,
      };
    }
  } catch {
    return {
      code: "RATE_LIMIT_UNAVAILABLE",
      message: "Rate limiting is temporarily unavailable.",
      status: 503,
    };
  }

  return null;
}

async function consumeQuota(env, clientKey) {
  if (!env.PROMPTIFY_QUOTA) {
    return {
      code: "QUOTA_NOT_CONFIGURED",
      message: "Usage quotas are not configured.",
      status: 503,
    };
  }

  try {
    const id = env.PROMPTIFY_QUOTA.idFromName("global");
    const stub = env.PROMPTIFY_QUOTA.get(id);
    const response = await stub.fetch("https://promptify.internal/quota", {
      method: "POST",
      body: JSON.stringify({
        clientKey,
        clientLimit: getPositiveInteger(env.PER_CLIENT_DAILY_QUOTA, DEFAULTS.perClientDailyQuota),
        globalLimit: getPositiveInteger(env.GLOBAL_DAILY_QUOTA, DEFAULTS.globalDailyQuota),
      }),
    });

    if (!response.ok) {
      return {
        code: "QUOTA_UNAVAILABLE",
        message: "Usage quotas are temporarily unavailable.",
        status: 503,
      };
    }

    const result = await response.json();
    if (!result.allowed) {
      return {
        code: "DAILY_QUOTA_EXCEEDED",
        message: "Daily enhancement quota reached. Please try again tomorrow.",
        status: 429,
      };
    }
  } catch {
    return {
      code: "QUOTA_UNAVAILABLE",
      message: "Usage quotas are temporarily unavailable.",
      status: 503,
    };
  }

  return null;
}

async function getClientKey(request) {
  const origin = request.headers.get("Origin") || "no-origin";
  const address = request.headers.get("CF-Connecting-IP") || "unknown-address";
  const raw = `${origin}:${address}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getCorsOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  const configured = String(env.PROMPTIFY_ALLOWED_ORIGINS || DEFAULT_EXTENSION_ORIGIN)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.some((allowedOrigin) => originMatches(origin, allowedOrigin)) ? origin : null;
}

function originMatches(origin, allowedOrigin) {
  if (origin === allowedOrigin) return true;

  if (allowedOrigin === "https://*.canva.com") {
    try {
      const url = new URL(origin);
      return url.protocol === "https:" &&
        (url.hostname === "canva.com" || url.hostname.endsWith(".canva.com"));
    } catch {
      return false;
    }
  }

  return false;
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };

  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(value, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

function errorResponse(code, message, status, extraHeaders = {}, origin = null) {
  return jsonResponse({ error: { code, message } }, status, origin, extraHeaders);
}

function getPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function timingSafeEqual(left, right) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return mismatch === 0;
}
