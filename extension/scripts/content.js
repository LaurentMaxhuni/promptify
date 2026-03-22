const ROOT_ID = "promptify-send-action";
const PREFERRED_FRAMEWORK_KEY = "preferredFramework";
const SITE_CONFIGS = {
  "chatgpt.com": {
    prompt: [
      "#prompt-textarea",
      "form textarea",
      "form [contenteditable='true'][data-placeholder]"
    ],
    send: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "chat.openai.com": {
    prompt: [
      "#prompt-textarea",
      "form textarea",
      "form [contenteditable='true'][data-placeholder]"
    ],
    send: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "claude.ai": {
    prompt: [
      "div.ProseMirror[contenteditable='true']",
      "[contenteditable='true'][data-placeholder]",
      "[contenteditable='true'][aria-label]"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[data-testid*="send"]',
      'button[type="submit"]'
    ]
  },
  "gemini.google.com": {
    prompt: [
      "rich-textarea .ql-editor[contenteditable='true']",
      ".ql-editor[contenteditable='true']",
      "textarea"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "grok.com": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "www.canva.com": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "www.perplexity.ai": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "poe.com": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "copilot.microsoft.com": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
      'button[type="submit"]'
    ]
  },
  "chat.deepseek.com": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "chat.mistral.ai": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "www.meta.ai": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  "meta.ai": {
    prompt: [
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ],
    send: [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  }
};

let host = null;
let shadowRootRef = null;
let optimizeButton = null;
let currentPrompt = null;
let currentSendButton = null;
let observer = null;
let mountScheduled = false;

initOptimizeAction();

function initOptimizeAction() {
  ensureUi();
  scheduleMount();

  observer = new MutationObserver(() => {
    scheduleMount();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        scheduleMount();
      },
      { once: true }
    );
  }

  window.addEventListener("focusin", scheduleMount, true);
  window.addEventListener("resize", scheduleMount);
}

function ensureUi() {
  if (host && optimizeButton) return;

  host = document.createElement("div");
  host.id = ROOT_ID;
  shadowRootRef = host.attachShadow({ mode: "open" });
  shadowRootRef.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      .shell {
        display: inline-flex;
        pointer-events: none;
        font-family: Inter, "Segoe UI", sans-serif;
      }

      .optimize-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        background: rgba(17, 24, 39, 0.72);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #ffffff;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          0 10px 24px rgba(2, 6, 23, 0.22);
        cursor: pointer;
        pointer-events: auto;
        transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
      }

      .optimize-button:hover {
        transform: translateY(-1px);
        background: rgba(30, 41, 59, 0.84);
        border-color: rgba(255, 255, 255, 0.34);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.12),
          0 12px 28px rgba(2, 6, 23, 0.26);
      }

      .optimize-button:active {
        transform: translateY(0);
      }

      .optimize-button:disabled {
        cursor: wait;
        opacity: 0.82;
        transform: none;
      }

      .optimize-button[data-state="success"] {
        background: rgba(8, 145, 178, 0.82);
      }

      .optimize-button[data-state="error"] {
        background: rgba(185, 28, 28, 0.76);
      }

      .icon {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
      }
    </style>
    <div class="shell">
      <button class="optimize-button" type="button" aria-label="Optimize prompt" title="Optimize prompt">
        <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3.5L13.9 8.1L18.5 10L13.9 11.9L12 16.5L10.1 11.9L5.5 10L10.1 8.1L12 3.5Z" fill="currentColor"></path>
          <path d="M18.5 14.5L19.4 16.6L21.5 17.5L19.4 18.4L18.5 20.5L17.6 18.4L15.5 17.5L17.6 16.6L18.5 14.5Z" fill="currentColor" opacity="0.9"></path>
        </svg>
      </button>
    </div>
  `;

  optimizeButton = shadowRootRef.querySelector(".optimize-button");
  optimizeButton.addEventListener("click", async () => {
    await handleOptimizeClick();
  });
}

function scheduleMount() {
  if (mountScheduled) return;
  mountScheduled = true;

  requestAnimationFrame(() => {
    mountScheduled = false;
    mountOptimizeButton();
  });
}

function mountOptimizeButton() {
  ensureUi();

  const prompt = findPromptTarget();
  const sendButton = prompt ? findSendButton(prompt) : null;

  if (!prompt || !sendButton || !sendButton.parentElement) {
    detachUi();
    currentPrompt = null;
    currentSendButton = null;
    return;
  }

  currentPrompt = prompt;
  currentSendButton = sendButton;

  const mountParent = sendButton.parentElement;
  if (host.parentElement !== mountParent || host.nextSibling !== sendButton) {
    mountParent.insertBefore(host, sendButton);
  } else if (!host.isConnected) {
    mountParent.insertBefore(host, sendButton);
  }

  host.style.display = "inline-flex";
  host.style.flex = "0 0 auto";
  host.style.alignSelf = "center";
  host.style.margin = "0 8px 0 0";
  host.style.pointerEvents = "none";
}

function detachUi() {
  if (host?.isConnected) {
    host.remove();
  }
}

function findPromptTarget() {
  const config = getSiteConfig();
  const candidates = [];

  config.prompt.forEach((selector, index) => {
    document.querySelectorAll(selector).forEach((element) => {
      candidates.push({ element, score: scorePromptCandidate(element, index) });
    });
  });

  const unique = new Map();
  for (const candidate of candidates) {
    if (!isPromptCandidate(candidate.element)) continue;

    const existing = unique.get(candidate.element);
    if (!existing || candidate.score > existing.score) {
      unique.set(candidate.element, candidate);
    }
  }

  return [...unique.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.element)[0] || null;
}

function findSendButton(prompt) {
  const config = getSiteConfig();
  const scopes = [];
  const promptForm = prompt.closest("form");

  if (promptForm) scopes.push(promptForm);
  const promptWrapper = prompt.parentElement;
  if (promptWrapper) scopes.push(promptWrapper);
  const outerComposer = prompt.closest('[data-testid*="composer"], [class*="composer"], [class*="prompt"], [class*="footer"], [class*="toolbar"]');
  if (outerComposer) scopes.push(outerComposer);
  scopes.push(document);

  const candidates = [];

  scopes.forEach((scope, scopeIndex) => {
    config.send.forEach((selector, selectorIndex) => {
      scope.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLButtonElement)) return;
        candidates.push({
          element,
          score: scoreSendButtonCandidate(element, prompt, scopeIndex, selectorIndex)
        });
      });
    });
  });

  const unique = new Map();
  for (const candidate of candidates) {
    if (!isSendButtonCandidate(candidate.element)) continue;

    const existing = unique.get(candidate.element);
    if (!existing || candidate.score > existing.score) {
      unique.set(candidate.element, candidate);
    }
  }

  return [...unique.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.element)[0] || null;
}

function getSiteConfig() {
  const hostname = window.location.hostname;
  return (
    SITE_CONFIGS[hostname] || {
      prompt: ["textarea", "[contenteditable='true'][role='textbox']", "[contenteditable='true']"],
      send: ['button[aria-label*="Send"]', 'button[type="submit"]']
    }
  );
}

function isPromptCandidate(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (!element.isConnected) return false;
  if (element.closest(`#${ROOT_ID}`)) return false;

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    if (element.disabled || element.readOnly) return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;

  const rect = element.getBoundingClientRect();
  if (rect.width < 160 || rect.height < 24) return false;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false;

  return true;
}

function isSendButtonCandidate(element) {
  if (!(element instanceof HTMLButtonElement)) return false;
  if (!element.isConnected) return false;
  if (element.disabled) return false;
  if (element.closest(`#${ROOT_ID}`)) return false;

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;

  const rect = element.getBoundingClientRect();
  return rect.width >= 24 && rect.height >= 24;
}

function scorePromptCandidate(element, selectorIndex) {
  const rect = element.getBoundingClientRect();
  const hints = [
    element.getAttribute("placeholder") || "",
    element.getAttribute("aria-label") || "",
    element.getAttribute("data-placeholder") || "",
    element.id || "",
    element.className || ""
  ].join(" ");

  let score = 100 - selectorIndex * 8;

  if (document.activeElement === element || element.contains(document.activeElement)) score += 50;
  if (element.closest("form")) score += 16;
  if (/(prompt|message|chat|ask|write|claude|gemini|grok)/i.test(hints)) score += 24;
  if (rect.width >= 280) score += 14;
  if (rect.height >= 36) score += 8;

  return score;
}

function scoreSendButtonCandidate(element, prompt, scopeIndex, selectorIndex) {
  const label = [
    element.getAttribute("aria-label") || "",
    element.textContent || "",
    element.className || "",
    element.getAttribute("data-testid") || ""
  ].join(" ");

  const buttonRect = element.getBoundingClientRect();
  const promptRect = prompt.getBoundingClientRect();
  let score = 100 - scopeIndex * 20 - selectorIndex * 8;

  if (/send|submit|arrow/i.test(label)) score += 24;
  if (prompt.closest("form") && element.closest("form") === prompt.closest("form")) score += 24;
  if (Math.abs(buttonRect.bottom - promptRect.bottom) < 120) score += 12;
  if (buttonRect.right >= promptRect.right - 120) score += 8;

  return score;
}

async function handleOptimizeClick() {
  const prompt = currentPrompt || findPromptTarget();
  if (!prompt) return;

  const text = readInputText(prompt);
  if (!text.trim()) {
    flashButtonState("error");
    return;
  }

  setButtonState("loading");

  try {
    const framework = await getPreferredFramework();
    const response = await sendEnhanceRequest(text, framework);
    const enhanced = sanitizeEnhancedPrompt(response?.data?.choices?.[0]?.message?.content);

    if (!enhanced) {
      throw new Error("No enhanced prompt returned");
    }

    await replacePromptContent(prompt, enhanced);
    focusPrompt(prompt);
    flashButtonState("success");
  } catch (error) {
    console.error("Promptify optimize failed", error);
    flashButtonState("error");
  }
}

function setButtonState(state) {
  if (!optimizeButton) return;

  if (state) {
    optimizeButton.dataset.state = state;
  } else {
    delete optimizeButton.dataset.state;
  }

  optimizeButton.disabled = state === "loading";
}

function flashButtonState(state) {
  setButtonState(state);
  window.clearTimeout(optimizeButton._promptifyResetTimer);
  optimizeButton._promptifyResetTimer = window.setTimeout(() => {
    setButtonState("");
  }, 1200);
}

function sendEnhanceRequest(text, framework) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "ENHANCE_TEXT", text, framework },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Enhance request failed"));
          return;
        }

        resolve(response);
      }
    );
  });
}

async function getPreferredFramework() {
  if (!chrome.storage?.local) return "";

  try {
    const stored = await chrome.storage.local.get(PREFERRED_FRAMEWORK_KEY);
    return typeof stored[PREFERRED_FRAMEWORK_KEY] === "string"
      ? stored[PREFERRED_FRAMEWORK_KEY]
      : "";
  } catch (error) {
    return "";
  }
}

function readInputText(target) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }

  if (target.isContentEditable) {
    return target.textContent || "";
  }

  return "";
}

async function replacePromptContent(target, value) {
  const normalizedValue = normalizeLineEndings(value);
  focusPrompt(target);
  selectPromptContent(target);
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    replaceFormControlText(target, normalizedValue);
    return;
  }

  if (target.isContentEditable) {
    const inserted = insertPlainTextIntoContentEditable(target, normalizedValue);
    if (inserted) return;
  }

  writeInputText(target, normalizedValue);
}

function selectPromptContent(target) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.focus();
    target.select();
    return;
  }

  if (target.isContentEditable) {
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}

function writeInputText(target, value) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const proto =
      target instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

    if (valueSetter) {
      valueSetter.call(target, value);
    } else {
      target.value = value;
    }

    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (target.isContentEditable) {
    target.focus();
    document.getSelection()?.removeAllRanges();
    target.textContent = value;
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function replaceFormControlText(target, value) {
  const setterTarget =
    target instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(setterTarget, "value")?.set;

  if (typeof target.setRangeText === "function") {
    target.focus();
    target.setSelectionRange(0, target.value.length);
    target.setRangeText(value, 0, target.value.length, "end");
  } else if (valueSetter) {
    valueSetter.call(target, value);
  } else {
    target.value = value;
  }

  target.dispatchEvent(new InputEvent("beforeinput", {
    bubbles: true,
    cancelable: true,
    inputType: "insertReplacementText",
    data: value
  }));
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

function insertPlainTextIntoContentEditable(target, value) {
  focusPrompt(target);
  selectPromptContent(target);

  try {
    if (document.execCommand("insertText", false, value)) {
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  } catch (error) {
  }

  try {
    const selection = document.getSelection();
    if (!selection) return false;

    const range = selection.rangeCount ? selection.getRangeAt(0) : document.createRange();
    range.deleteContents();

    const fragment = document.createDocumentFragment();
    const lines = normalizeLineEndings(value).split("\n");
    lines.forEach((line, index) => {
      fragment.appendChild(document.createTextNode(line));
      if (index < lines.length - 1) {
        fragment.appendChild(document.createElement("br"));
      }
    });

    range.insertNode(fragment);
    selection.removeAllRanges();

    const endRange = document.createRange();
    endRange.selectNodeContents(target);
    endRange.collapse(false);
    selection.addRange(endRange);

    target.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertReplacementText",
      data: value
    }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch (error) {
    return false;
  }
}

function focusPrompt(target) {
  if (!(target instanceof HTMLElement)) return;

  target.focus();

  if (target.isContentEditable) {
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.setSelectionRange(target.value.length, target.value.length);
  }
}

function normalizeLineEndings(value) {
  return String(value).replace(/\r\n?/g, "\n");
}

function sanitizeEnhancedPrompt(text) {
  if (typeof text !== "string") return "";

  const labelKeywords = [
    "role",
    "task",
    "objective",
    "goal",
    "goals",
    "context",
    "instructions",
    "instruction",
    "requirements",
    "requirement",
    "constraints",
    "constraint",
    "output format",
    "response format",
    "tone",
    "style",
    "audience",
    "notes",
    "steps",
    "example",
    "examples",
    "input",
    "output"
  ];

  let cleaned = normalizeLineEndings(text);
  cleaned = cleaned.replace(/```[^`\n]*\n?/g, "");
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  cleaned = cleaned
    .split("\n")
    .map((line) => {
      let next = line.trim();
      if (!next) return "";

      next = next.replace(/^#{1,6}\s*/, "");
      next = next.replace(/^>\s?/, "");
      next = next.replace(/^[-*]\s+/, "");
      next = next.replace(/^\d+\.\s+/, "");
      next = next.replace(/\*\*(.*?)\*\*/g, "$1");
      next = next.replace(/__(.*?)__/g, "$1");
      next = next.replace(/\*(.*?)\*/g, "$1");
      next = next.replace(/_(.*?)_/g, "$1");

      const lowered = next.toLowerCase();
      const standaloneLabel = labelKeywords.some((keyword) => lowered === keyword);
      if (standaloneLabel) {
        return "";
      }

      for (const keyword of labelKeywords) {
        const prefix = new RegExp(`^${escapeRegex(keyword)}\\s*:\\s*`, "i");
        if (prefix.test(next)) {
          next = next.replace(prefix, "").trim();
          break;
        }
      }

      return next;
    })
    .filter((line, index, array) => {
      if (line) return true;
      return index > 0 && index < array.length - 1 && array[index - 1] && array[index + 1];
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}
