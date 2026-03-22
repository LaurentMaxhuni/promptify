const enhanceButton = document.getElementById('enhance-button');
const input = document.getElementById('input');
const output = document.getElementById('output');
const framework = document.getElementById('framework-select');
const copyButton = document.getElementById('copy-button');
const historyToggleButton = document.getElementById('history-toggle-button');
const historyCloseButton = document.getElementById('history-close-button');
const historyBackdrop = document.getElementById('history-backdrop');
const historySidebar = document.getElementById('history-sidebar');
const loadHistoryButton = document.getElementById('load-history-button');
const historyList = document.getElementById('history-list');
const CHAT_HISTORY_KEY = 'chatHistory';
const PREFERRED_FRAMEWORK_KEY = 'preferredFramework';
let lastEnhanced = '';
let chatHistory = [];

input.addEventListener('input', syncInputState);
input.addEventListener('paste', (event) => {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') ?? '';
  document.execCommand('insertText', false, text);
});

enhanceButton.addEventListener('click', () => {
  const text = getInputText();
  if (!text.trim()) return;

  chrome.runtime.sendMessage(
    { type: "ENHANCE_TEXT", text, framework: framework.value},
    async (response) => {
      const enhanced = response?.data?.choices?.[0]?.message?.content;
      const cleaned = sanitizeEnhancedPrompt(enhanced);
      if (!cleaned) return;

      lastEnhanced = cleaned;
      output.textContent = cleaned;
      await addHistoryEntry({
        prompt: text,
        response: cleaned,
        framework: framework.value || '',
        createdAt: Date.now()
      });
    }
  );
});

copyButton.addEventListener('click', async () => {
  const text = lastEnhanced || getInputText();
  if (!text.trim()) return;

  const copied = await copyText(text);
  if (!copied) return;

  copyButton.dataset.state = 'copied';
  copyButton.setAttribute('aria-label', 'Copied');
  window.clearTimeout(copyButton._resetTimer);
  copyButton._resetTimer = window.setTimeout(() => {
    delete copyButton.dataset.state;
    copyButton.setAttribute('aria-label', 'Copy output');
  }, 1200);
});

loadHistoryButton.addEventListener('click', async () => {
  await refreshHistory();
});

framework.addEventListener('change', async () => {
  await savePreferredFramework(framework.value);
});

historyToggleButton.addEventListener('click', async () => {
  const isOpening = !historySidebar.classList.contains('is-open');
  setHistorySidebarOpen(isOpening);

  if (isOpening) {
    await refreshHistory();
  }
});

historyCloseButton.addEventListener('click', () => {
  setHistorySidebarOpen(false);
});

historyBackdrop.addEventListener('click', () => {
  setHistorySidebarOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setHistorySidebarOpen(false);
  }
});

historyList.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-history-index]');
  if (!trigger) return;

  const index = Number(trigger.dataset.historyIndex);
  if (Number.isNaN(index)) return;

  openHistoryEntry(index);
});

function getInputText() {
  return (input.innerText || '').replace(/\r\n?/g, '\n').replace(/\n$/, '');
}

function syncInputState() {
  input.dataset.empty = getInputText().trim() ? 'false' : 'true';
}

syncInputState();
copyButton.setAttribute('aria-label', 'Copy output');
renderHistory();
initializePreferredFramework();

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
  }

  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  temp.style.pointerEvents = 'none';
  document.body.appendChild(temp);
  temp.select();
  temp.setSelectionRange(0, temp.value.length);

  try {
    return document.execCommand('copy');
  } finally {
    temp.remove();
  }
}

async function addHistoryEntry(entry) {
  if (!chrome.storage?.local) return;

  try {
    const existing = await chrome.storage.local.get(CHAT_HISTORY_KEY);
    const history = Array.isArray(existing[CHAT_HISTORY_KEY])
      ? existing[CHAT_HISTORY_KEY]
      : [];

    history.unshift(entry);
    await chrome.storage.local.set({ [CHAT_HISTORY_KEY]: history });
    chatHistory = history;
    renderHistory();
  } catch (error) {
    console.error('Failed to save chat history', error);
  }
}

async function initializePreferredFramework() {
  if (!chrome.storage?.local) return;

  try {
    const stored = await chrome.storage.local.get(PREFERRED_FRAMEWORK_KEY);
    const frameworkValue = stored[PREFERRED_FRAMEWORK_KEY];

    if (
      typeof frameworkValue === 'string' &&
      frameworkValue &&
      framework.querySelector(`option[value="${cssEscape(frameworkValue)}"]`)
    ) {
      framework.value = frameworkValue;
    }
  } catch (error) {
    console.error('Failed to load preferred framework', error);
  }
}

async function savePreferredFramework(value) {
  if (!chrome.storage?.local || typeof value !== 'string' || !value) return;

  try {
    await chrome.storage.local.set({ [PREFERRED_FRAMEWORK_KEY]: value });
  } catch (error) {
    console.error('Failed to save preferred framework', error);
  }
}

async function refreshHistory() {
  loadHistoryButton.disabled = true;
  loadHistoryButton.textContent = 'Loading...';

  try {
    if (!chrome.storage?.local) {
      chatHistory = [];
      renderHistory('Storage is unavailable in this popup.');
      return;
    }

    const stored = await chrome.storage.local.get(CHAT_HISTORY_KEY);
    chatHistory = Array.isArray(stored[CHAT_HISTORY_KEY])
      ? stored[CHAT_HISTORY_KEY]
      : [];
    renderHistory();
  } catch (error) {
    console.error('Failed to load chat history', error);
    renderHistory('Failed to load saved chats.');
  } finally {
    loadHistoryButton.disabled = false;
    loadHistoryButton.textContent = 'Reload Chats';
  }
}

function renderHistory(message) {
  if (message) {
    historyList.innerHTML = `<p class="history-empty">${escapeHtml(message)}</p>`;
    return;
  }

  if (!chatHistory.length) {
    historyList.innerHTML = `<p class="history-empty">${escapeHtml(
      historyList.dataset.placeholder || 'No saved chats yet.'
    )}</p>`;
    return;
  }

  historyList.innerHTML = chatHistory
    .map((entry, index) => {
      const frameworkLabel = escapeHtml(entry.framework || 'Custom');
      const promptPreview = escapeHtml(truncateText(entry.prompt || '', 88));
      const responsePreview = escapeHtml(truncateText(entry.response || '', 120));
      const timestamp = escapeHtml(formatTimestamp(entry.createdAt));

      return `
        <article class="history-item">
          <div class="history-item-top">
            <span class="history-badge">${frameworkLabel}</span>
            <span class="history-time">${timestamp}</span>
          </div>
          <p class="history-prompt">${promptPreview || 'No prompt saved.'}</p>
          <p class="history-response">${responsePreview || 'No response saved.'}</p>
          <button class="history-open-button" type="button" data-history-index="${index}">Open</button>
        </article>
      `;
    })
    .join('');
}

function openHistoryEntry(index) {
  const entry = chatHistory[index];
  if (!entry) return;

  input.textContent = entry.prompt || '';
  syncInputState();

  if (entry.framework && framework.querySelector(`option[value="${cssEscape(entry.framework)}"]`)) {
    framework.value = entry.framework;
  } else {
    framework.value = '';
  }

  lastEnhanced = entry.response || '';
  output.textContent = lastEnhanced || '';
  setHistorySidebarOpen(false);
}

function truncateText(text, maxLength) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatTimestamp(value) {
  if (!value) return 'Unknown time';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, '\\$&');
}

function setHistorySidebarOpen(isOpen) {
  historySidebar.classList.toggle('is-open', isOpen);
  historyBackdrop.classList.toggle('is-open', isOpen);
  historySidebar.setAttribute('aria-hidden', String(!isOpen));
  historyBackdrop.setAttribute('aria-hidden', String(!isOpen));
  historyToggleButton.setAttribute('aria-expanded', String(isOpen));
}

function sanitizeEnhancedPrompt(text) {
  if (typeof text !== 'string') return '';

  const labelKeywords = [
    'role',
    'task',
    'objective',
    'goal',
    'goals',
    'context',
    'instructions',
    'instruction',
    'requirements',
    'requirement',
    'constraints',
    'constraint',
    'output format',
    'response format',
    'tone',
    'style',
    'audience',
    'notes',
    'steps',
    'example',
    'examples',
    'input',
    'output'
  ];

  let cleaned = text.replace(/\r\n?/g, '\n');
  cleaned = cleaned.replace(/```[^`\n]*\n?/g, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  cleaned = cleaned
    .split('\n')
    .map((line) => {
      let next = line.trim();
      if (!next) return '';

      next = next.replace(/^#{1,6}\s*/, '');
      next = next.replace(/^>\s?/, '');
      next = next.replace(/^[-*]\s+/, '');
      next = next.replace(/^\d+\.\s+/, '');
      next = next.replace(/\*\*(.*?)\*\*/g, '$1');
      next = next.replace(/__(.*?)__/g, '$1');
      next = next.replace(/\*(.*?)\*/g, '$1');
      next = next.replace(/_(.*?)_/g, '$1');

      const lowered = next.toLowerCase();
      const standaloneLabel = labelKeywords.some((keyword) => lowered === keyword);
      if (standaloneLabel) {
        return '';
      }

      for (const keyword of labelKeywords) {
        const prefix = new RegExp(`^${escapeRegex(keyword)}\\s*:\\s*`, 'i');
        if (prefix.test(next)) {
          next = next.replace(prefix, '').trim();
          break;
        }
      }

      return next;
    })
    .filter((line, index, array) => {
      if (line) return true;
      return index > 0 && index < array.length - 1 && array[index - 1] && array[index + 1];
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderMarkdown(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let inCodeBlock = false;
  let codeFenceLang = "";
  let listType = null;
  let inBlockquote = false;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }
  };

  for (const line of lines) {
    const codeFenceMatch = line.match(/^\s*```([^`]*)$/);
    if (codeFenceMatch) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
        codeFenceLang = "";
      } else {
        closeList();
        closeBlockquote();
        inCodeBlock = true;
        codeFenceLang = codeFenceMatch[1].trim();
        const className = codeFenceLang ? ` class="language-${escapeHtml(codeFenceLang)}"` : "";
        html.push(`<pre><code${className}>`);
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      html.push(
        `<h${level}>${renderInlineWithCode(headingMatch[2].trim())}</h${level}>`
      );
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      closeList();
      if (!inBlockquote) {
        html.push("<blockquote>");
        inBlockquote = true;
      }
      html.push(`<p>${renderInlineWithCode(blockquoteMatch[1])}</p>`);
      continue;
    }
    closeBlockquote();

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (olMatch || ulMatch) {
      const type = olMatch ? "ol" : "ul";
      const content = renderInlineWithCode((olMatch || ulMatch)[1]);
      if (listType && listType !== type) {
        closeList();
      }
      if (!listType) {
        html.push(`<${type}>`);
        listType = type;
      }
      html.push(`<li>${content}</li>`);
      continue;
    }
    closeList();

    if (!line.trim()) {
      html.push('<div class="md-blank"></div>');
      continue;
    }

    html.push(`<p>${renderInlineWithCode(line)}</p>`);
  }

  if (inCodeBlock) {
    html.push("</code></pre>");
  }
  closeList();
  closeBlockquote();

  return html.join("");
}

function renderInlineWithCode(text) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }
      return renderInline(part);
    })
    .join("");
}

function renderInline(text) {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replace(/\*(?!\s)([^*]+?)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/_(?!\s)([^_]+?)_(?!_)/g, "<em>$1</em>");
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const safeUrl = sanitizeUrl(url);
    const safeHref = escapeHtml(safeUrl);
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return result;
}

function sanitizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return trimmed;
  }
  if (!/^[a-z][a-z0-9+.-]*:/.test(lower)) {
    return trimmed;
  }
  return "#";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
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
