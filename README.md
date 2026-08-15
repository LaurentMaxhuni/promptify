# Promptify

Promptify is a Chrome extension that helps you enhance prompt text with a single click.

## Features
- Prompt input and enhanced output UI
- One-click Enhance workflow
- Lightweight popup and inline Optimize button on supported sites

## Supported sites
- chatgpt.com and chat.openai.com
- claude.ai
- gemini.google.com
- grok.com
- *.canva.com
- www.perplexity.ai
- poe.com
- copilot.microsoft.com
- chat.deepseek.com
- chat.mistral.ai
- www.meta.ai and meta.ai

## Install (GitHub release)
The extension is distributed via GitHub releases for now.

1. Download the Promptify v1.2 package from:
   https://github.com/LaurentMaxhuni/promptify/releases
2. Unzip the package.
3. Open Chrome and go to `chrome://extensions`.
4. Enable Developer mode.
5. Click "Load unpacked" and select the unzipped extension folder.

## Package the extension
To create a Chrome Web Store-ready zip locally, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\zip-extension.ps1
```

The zip is written to `artifacts/` and is named from the extension version in `extension/manifest.json`.

There is also a GitHub Actions workflow at `.github/workflows/package-extension.yml`.
It runs on manual dispatch or when you push a tag like `extension-v1.2`, and uploads the packaged zip as a workflow artifact.

## Auto-upload for review
If you want to automate Chrome Web Store uploads, use the official Chrome Web Store API with a service account linked to your publisher account:

- Service accounts: https://developer.chrome.com/docs/webstore/service-accounts
- Chrome Web Store API overview: https://developer.chrome.com/docs/webstore/using-api
- Publish method reference: https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish
- Status method reference: https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus

I added a publish script for existing extension items at `scripts/publish-extension.ps1`. It will:

1. Package `extension/` into a zip if needed.
2. Mint an access token from your service account.
3. Upload the zip to the Chrome Web Store API.
4. Call `publish`, which submits the version for review.
5. Fetch the latest item status.

Set these environment variables before running it locally:

```powershell
$env:CWS_PUBLISHER_ID = "your-publisher-id"
$env:CWS_EXTENSION_ID = "your-extension-id"
$env:CWS_SERVICE_ACCOUNT_JSON_PATH = "C:\path\to\service-account.json"
pwsh -File .\scripts\publish-extension.ps1
```

This publish script requires PowerShell 7+ because it signs a Google service-account JWT. If you only have Windows PowerShell 5.1, use the GitHub Actions workflow instead.

If you prefer not to keep a key file on disk, you can pass the JSON via `CWS_SERVICE_ACCOUNT_JSON` instead.

There is also a GitHub Actions workflow at `.github/workflows/publish-extension.yml`. Add these repository secrets:

- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`
- `CWS_SERVICE_ACCOUNT_JSON`

Then run the workflow manually from GitHub Actions.

Notes:

- This flow is for updating an existing Chrome Web Store item, not creating the first listing.
- Before API publishing works, the item must already exist and the Store Listing and Privacy tabs must be completed in the dashboard.
- If you changed visibility settings in the dashboard, Google requires one manual publish with that new visibility before API publishing works again.

## Backend (Cloudflare Worker)
The frontend is deployed separately on Vercel. Cloudflare is used only for the API Worker.

The extension calls the backend at:
`https://promptify.qwert123456789.workers.dev/api/groq`

The Worker source is in `backend/`. The repository-level `wrangler.toml` explicitly points
Wrangler at `backend/src/index.js`, so Cloudflare Workers Builds does not try to detect or
deploy frontend static files.

For Cloudflare Workers Builds, use these settings:

- Git branch: `main`
- Root directory: leave blank (repository root)
- Build command: leave blank
- Deploy command: `npx wrangler deploy`

If you instead set the root directory to `backend`, use `backend/wrangler.toml` and run the
same deploy command from that directory.

To run it locally:
1. Open `backend/`.
2. Create `backend/.dev.vars` with `GROQ_API_KEY` and `PROMPTIFY_API_TOKEN`.
3. Start the dev server from `backend/`: `npx wrangler dev`

To deploy your own version:
1. From the repository root, set the secret: `npx wrangler secret put GROQ_API_KEY`
2. Set the authentication secret: `npx wrangler secret put PROMPTIFY_API_TOKEN`
3. Update `PROMPTIFY_ALLOWED_ORIGINS` in `wrangler.toml` if your extension ID differs.
4. Deploy from the repository root: `npx wrangler deploy`
5. Update `WORKER_URL` in `extension/background.js` to point to your Worker URL.

The endpoint accepts only authenticated `POST` requests with a JSON body:

```json
{ "prompt": "your prompt", "framework": "RACE" }
```

The framework may be an empty string for the explicit no-framework mode. Requests are protected
by a per-client rate limit, per-client daily quota, and global daily quota. Prompt text is not
put in the request URL.

The packaged extension receives `PROMPTIFY_API_TOKEN` from the `PROMPTIFY_API_TOKEN` environment
variable during packaging. Set it before running `scripts/zip-extension.ps1`, and add the same
value as a repository secret for the package workflow. Treat a published extension token as
extractable client configuration; rotate it and rely on the Worker quotas/rate limits as defense
in depth.

Run the focused Worker regression checks with:

```powershell
node .\scripts\verify-worker.mjs
```

The checked-in Worker is named `promptify-api`, while the published extension currently targets
`promptify.qwert123456789.workers.dev`. Verify the deployed workers.dev hostname before releasing;
if the deployed Worker uses the checked-in name, update `WORKER_URL` and the manifest host permission
to the corresponding `promptify-api` hostname.
