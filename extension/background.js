chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ENHANCE_TEXT") {
    enhanceText(msg.text, msg.framework)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: {
            code: err.code || "REQUEST_FAILED",
            message: err.message || "Enhancement request failed.",
          },
          status: err.status || 0,
        }),
      );
    return true;
  }
});

const WORKER_URL = "https://promptify.qwert123456789.workers.dev";
// Packaging injects the deployment token into the staging copy. Never commit a real token here.
const API_TOKEN = "__PROMPTIFY_API_TOKEN__";

async function enhanceText(text, framework) {
  const headers = { "Content-Type": "application/json" };
  if (API_TOKEN && !API_TOKEN.startsWith("__")) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  const res = await fetch(`${WORKER_URL}/api/groq`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: text,
      framework: typeof framework === "string" ? framework : "",
    }),
  });

  const payload = await readJsonResponse(res);
  if (!res.ok) {
    const error = new Error(
      payload?.error?.message || payload?.error || `Enhancement request failed (${res.status}).`,
    );
    error.code = payload?.error?.code || "REQUEST_FAILED";
    error.status = res.status;
    throw error;
  }

  return payload;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: {
        code: "INVALID_RESPONSE",
        message: "The enhancement service returned an invalid response.",
      },
    };
  }
}
