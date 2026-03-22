# Promptify

Promptify is a Chrome extension that helps you enhance prompt text with a single click.

## Features
- Prompt input and enhanced output UI
- One-click Enhance workflow
- Lightweight popup and side panel on supported sites

## Supported sites
- chatgpt.com and chat.openai.com
- claude.ai
- gemini.google.com
- grok.com

## Install (GitHub release)
The extension is distributed via GitHub releases for now.

1. Download the release from:
   https://github.com/LaurentMaxhuni/promptify/releases/tag/v1.0
2. Unzip the release (or the Source code zip from the release page).
3. Open Chrome and go to `chrome://extensions`.
4. Enable Developer mode.
5. Click "Load unpacked" and select the `extension/` folder from the repo.

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

## Backend (optional)
If you wish to use your own API key follow the steps below.
The extension calls a local backend at:
`http://localhost:6767/api/groq?prompt=...`

To run it locally:
1. Open `backend/`.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set `GROQ_API_KEY`.
4. Start the server: `npm start`
