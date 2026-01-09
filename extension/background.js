chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ENHANCE_TEXT") {
    enhanceText(msg.text)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

async function enhanceText(text) {
  const res = await fetch(
    `http://localhost:6767/api/groq?prompt=${encodeURIComponent(text)}`
  );
  return res.json();
}
