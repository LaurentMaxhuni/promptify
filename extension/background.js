chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ENHANCE_TEXT") {
    enhanceText(msg.text, msg.framework)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

const URL = "https://promptify-azfb.onrender.com";
// This is for development. It's stored here since there aren't .env files in Chrome Extensions.
const URL_LCL = "http://localhost:6767"

async function enhanceText(text, framework) {
  const res = await fetch(
    `${URL}/api/groq?prompt=${encodeURIComponent(
      text
    )}&framework=${encodeURIComponent(framework)}`
  );
  return res.json();
}
