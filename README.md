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

## Backend (optional)
If you wish to use your own API key follow the steps below.
The extension calls a local backend at:
`http://localhost:6767/api/groq?prompt=...`

To run it locally:
1. Open `backend/`.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set `GROQ_API_KEY`.
4. Start the server: `npm start`
