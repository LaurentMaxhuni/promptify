import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";

globalThis.crypto ??= webcrypto;

const workerSource = await readFile(new URL("../backend/src/index.js", import.meta.url), "utf8");
const promptSource = await readFile(
  new URL("../backend/src/lib/promptify-system-prompt.js", import.meta.url),
  "utf8",
);
const bundledSource = `${promptSource.replace("export default function", "function")}
${workerSource.replace('import getSystemPrompt from "./lib/promptify-system-prompt.js";', "")}`;
const workerModule = await import(
  `data:text/javascript;base64,${Buffer.from(bundledSource).toString("base64")}`,
);

const extensionOrigin = "chrome-extension://egbcpmegonokjknlibpddibiocjfoggg";
let upstreamResponse = new Response(
  JSON.stringify({
    choices: [{ message: { content: "Enhanced prompt" } }],
  }),
  { status: 200, headers: { "Content-Type": "application/json" } },
);
const upstreamCalls = [];

globalThis.fetch = async (url, init) => {
  assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
  upstreamCalls.push({ url, init });
  return upstreamResponse;
};

function makeEnv(overrides = {}) {
  return {
    GROQ_API_KEY: "groq-test-key",
    PROMPTIFY_API_TOKEN: "promptify-test-token",
    PROMPTIFY_ALLOWED_ORIGINS: extensionOrigin,
    RATE_LIMITER: {
      limit: async () => ({ success: overrides.rateLimitAllowed ?? true }),
    },
    PROMPTIFY_QUOTA: {
      idFromName: () => "global",
      get: () => ({
        fetch: async () =>
          new Response(JSON.stringify({ allowed: overrides.quotaAllowed ?? true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    },
  };
}

function makeRequest(body, headers = {}, method = "POST") {
  return new Request("https://worker.test/api/groq", {
    method,
    headers: {
      Origin: extensionOrigin,
      Authorization: "Bearer promptify-test-token",
      "Content-Type": "application/json",
      ...headers,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

async function readBody(response) {
  return response.json();
}

const worker = workerModule.default;

let response = await worker.fetch(
  makeRequest({ prompt: "old query format" }, {}, "GET"),
  makeEnv(),
);
assert.equal(response.status, 405);
assert.equal(upstreamCalls.length, 0);

response = await worker.fetch(
  makeRequest({ prompt: "unauthenticated" }, { Authorization: "Bearer wrong-token" }),
  makeEnv(),
);
assert.equal(response.status, 401);
assert.equal(upstreamCalls.length, 0);

response = await worker.fetch(
  makeRequest({ prompt: "unconfigured auth" }),
  { ...makeEnv(), PROMPTIFY_API_TOKEN: "" },
);
assert.equal(response.status, 503);
assert.equal((await readBody(response)).error.code, "AUTH_NOT_CONFIGURED");

response = await worker.fetch(makeRequest({ prompt: "draft a launch plan", framework: "" }), makeEnv());
assert.equal(response.status, 200);
assert.equal(upstreamCalls.length, 1);
assert.equal(new URL(upstreamCalls[0].url).search, "");
assert.deepEqual(JSON.parse(upstreamCalls[0].init.body).messages.at(-1), {
  role: "user",
  content: "draft a launch plan",
});
const systemPrompt = JSON.parse(upstreamCalls[0].init.body).messages[0].content;
assert.match(systemPrompt, /No named framework is selected/);
assert.match(systemPrompt, /Return exactly one copy-paste-ready prompt/);
assert.match(systemPrompt, /Do not over-engineer a simple request/);
assert.equal(response.headers.get("Access-Control-Allow-Origin"), extensionOrigin);

response = await worker.fetch(makeRequest({ prompt: "bad framework", framework: "UNKNOWN" }), makeEnv());
assert.equal(response.status, 400);
assert.equal((await readBody(response)).error.code, "INVALID_FRAMEWORK");

upstreamResponse = new Response(JSON.stringify({ error: "bad gateway" }), {
  status: 502,
  headers: { "Content-Type": "application/json" },
});
response = await worker.fetch(makeRequest({ prompt: "upstream failure", framework: "RACE" }), makeEnv());
assert.equal(response.status, 502);
assert.equal((await readBody(response)).error.code, "UPSTREAM_ERROR");

upstreamResponse = new Response(
  JSON.stringify({ choices: [{ message: { content: "Enhanced prompt" } }] }),
  { status: 200, headers: { "Content-Type": "application/json" } },
);
response = await worker.fetch(makeRequest({ prompt: "rate limited" }), makeEnv({ rateLimitAllowed: false }));
assert.equal(response.status, 429);
assert.equal((await readBody(response)).error.code, "RATE_LIMITED");

response = await worker.fetch(makeRequest({ prompt: "quota limited" }), makeEnv({ quotaAllowed: false }));
assert.equal(response.status, 429);
assert.equal((await readBody(response)).error.code, "DAILY_QUOTA_EXCEEDED");

console.log("Worker regression checks passed.");
