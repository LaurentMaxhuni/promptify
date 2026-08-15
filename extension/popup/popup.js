const enhanceButton = document.getElementById('enhance-button');
const enhanceLabel = document.getElementById('enhance-label');
const input = document.getElementById('input');
const output = document.getElementById('output');
const framework = document.getElementById('framework-select');
const copyButton = document.getElementById('copy-button');
const historyToggleButton = document.getElementById('history-toggle-button');
const historyCloseButton = document.getElementById('history-close-button');
const historyBackdrop = document.getElementById('history-backdrop');
const historySidebar = document.getElementById('history-sidebar');
const loadHistoryButton = document.getElementById('load-history-button');
const clearHistoryButton = document.getElementById('clear-history-button');
const historyList = document.getElementById('history-list');
const statusMessage = document.getElementById('status-message');
const retryButton = document.getElementById('retry-button');
const CHAT_HISTORY_KEY = 'chatHistory';
const PREFERRED_FRAMEWORK_KEY = 'preferredFramework';
const MAX_HISTORY_ENTRIES = 50;
const MAX_HISTORY_BYTES = 250_000;
let lastEnhanced = '';
let lastEnhancedInput = '';
let chatHistory = [];
let historyReturnFocus = null;

// ── Loading text cycling (like Claude Code) ──
const LOADING_WORDS = [
  'Refining',
  'Optimizing',
  'Polishing',
  'Enhancing',
  'Crafting',
  'Structuring',
  'Improving',
  'Sharpening'
];
let loadingInterval = null;
let currentLoadingIdx = 0;

function startLoadingState() {
  enhanceButton.disabled = true;
  currentLoadingIdx = 0;
  enhanceLabel.textContent = LOADING_WORDS[0] + '...';

  loadingInterval = setInterval(() => {
    currentLoadingIdx = (currentLoadingIdx + 1) % LOADING_WORDS.length;
    enhanceLabel.textContent = LOADING_WORDS[currentLoadingIdx] + '...';
  }, 800);
}

function stopLoadingState() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  enhanceButton.disabled = false;
  enhanceLabel.textContent = 'Optimize';
}

input.addEventListener('input', () => {
  syncInputState();
  invalidateEnhancedResult();
});
input.addEventListener('paste', (event) => {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') ?? '';
  document.execCommand('insertText', false, text);
});

enhanceButton.addEventListener('click', async () => {
  await enhanceCurrentPrompt();
});

retryButton.addEventListener('click', async () => {
  await enhanceCurrentPrompt();
});

async function enhanceCurrentPrompt() {
  const text = getInputText();
  if (!text.trim()) {
    setStatusMessage('Enter a prompt before optimizing.', 'error');
    input.focus();
    return;
  }

  const frameworkValue = framework.value;

  startLoadingState();
  setStatusMessage('Optimizing your prompt...', 'loading');
  retryButton.hidden = true;

  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "ENHANCE_TEXT", text, framework: frameworkValue },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        }
      );
    });

    if (!response?.ok) {
      const error = response?.error;
      throw new Error(
        typeof error === 'object' ? error.message : error || 'Enhancement request failed.',
      );
    }

    if (getInputText() !== text || framework.value !== frameworkValue) {
      setStatusMessage('The prompt changed while it was being optimized. Run it again.', 'error');
      retryButton.hidden = false;
      return;
    }

    const enhanced = response?.data?.choices?.[0]?.message?.content;
    const cleaned = sanitizeEnhancedPrompt(enhanced);
    if (!cleaned) throw new Error('No enhanced prompt returned');

    lastEnhanced = cleaned;
    lastEnhancedInput = text;
    output.textContent = cleaned;
    const saved = await addHistoryEntry({
      prompt: text,
      response: cleaned,
      framework: frameworkValue || '',
      createdAt: Date.now()
    });

    retryButton.hidden = true;
    setStatusMessage(
      saved ? 'Prompt optimized.' : 'Prompt optimized, but it could not be saved to history.',
      saved ? 'success' : 'error',
    );
  } catch (error) {
    console.error('Enhance failed', error);
    setStatusMessage(error.message || 'Enhancement failed. Try again.', 'error');
    retryButton.hidden = false;
  } finally {
    stopLoadingState();
  }
}

copyButton.addEventListener('click', async () => {
  const currentInput = getInputText();
  const text = lastEnhanced && lastEnhancedInput === currentInput ? lastEnhanced : currentInput;
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
  invalidateEnhancedResult();
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
  if (!historySidebar.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    setHistorySidebarOpen(false);
    return;
  }

  if (event.key === 'Tab') {
    trapHistoryFocus(event);
  }
});

historyList.addEventListener('click', (event) => {
  const deleteTrigger = event.target.closest('[data-history-delete-index]');
  if (deleteTrigger) {
    const deleteIndex = Number(deleteTrigger.dataset.historyDeleteIndex);
    if (!Number.isNaN(deleteIndex)) deleteHistoryEntry(deleteIndex);
    return;
  }

  const trigger = event.target.closest('[data-history-index]');
  if (!trigger) return;

  const index = Number(trigger.dataset.historyIndex);
  if (Number.isNaN(index)) return;

  openHistoryEntry(index);
});

clearHistoryButton.addEventListener('click', clearHistory);

function getInputText() {
  return (input.innerText || '').replace(/\r\n?/g, '\n').replace(/\n$/, '');
}

function syncInputState() {
  input.dataset.empty = getInputText().trim() ? 'false' : 'true';
}

syncInputState();
copyButton.setAttribute('aria-label', 'Copy output');
initializeHistorySidebar();
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
  if (!chrome.storage?.local) return false;

  try {
    const existing = await chrome.storage.local.get(CHAT_HISTORY_KEY);
    const history = Array.isArray(existing[CHAT_HISTORY_KEY])
      ? existing[CHAT_HISTORY_KEY]
      : [];

    const normalizedEntry = normalizeHistoryEntry(entry);
    const nextHistory = limitHistory([normalizedEntry, ...history]);
    if (!normalizedEntry || !nextHistory[0] || nextHistory[0].prompt !== normalizedEntry.prompt || nextHistory[0].response !== normalizedEntry.response) {
      console.error('History entry exceeded the storage limit');
      return false;
    }

    await chrome.storage.local.set({ [CHAT_HISTORY_KEY]: nextHistory });
    chatHistory = nextHistory;
    renderHistory();
    return true;
  } catch (error) {
    console.error('Failed to save chat history', error);
    return false;
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
  if (!chrome.storage?.local || typeof value !== 'string') return false;

  try {
    if (value) {
      await chrome.storage.local.set({ [PREFERRED_FRAMEWORK_KEY]: value });
    } else {
      await chrome.storage.local.remove(PREFERRED_FRAMEWORK_KEY);
    }
    return true;
  } catch (error) {
    console.error('Failed to save preferred framework', error);
    setStatusMessage('Your framework preference could not be saved.', 'error');
    return false;
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
    const storedHistory = Array.isArray(stored[CHAT_HISTORY_KEY])
      ? stored[CHAT_HISTORY_KEY]
      : [];
    chatHistory = limitHistory(storedHistory);
    if (chatHistory.length !== storedHistory.length) {
      await chrome.storage.local.set({ [CHAT_HISTORY_KEY]: chatHistory });
    }
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
          <div class="history-item-actions">
            <button class="history-open-button" type="button" data-history-index="${index}">Open</button>
            <button class="history-delete-button" type="button" data-history-delete-index="${index}">Delete</button>
          </div>
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
  lastEnhancedInput = entry.prompt || '';
  output.textContent = lastEnhanced || '';
  setStatusMessage('Saved prompt opened.', 'success');
  setHistorySidebarOpen(false);
}

async function deleteHistoryEntry(index) {
  if (!chrome.storage?.local || !chatHistory[index]) return;

  try {
    chatHistory = chatHistory.filter((_, entryIndex) => entryIndex !== index);
    await chrome.storage.local.set({ [CHAT_HISTORY_KEY]: chatHistory });
    renderHistory();
    setStatusMessage('Saved prompt deleted.', 'success');
  } catch (error) {
    console.error('Failed to delete chat history entry', error);
    setStatusMessage('The saved prompt could not be deleted.', 'error');
    await refreshHistory();
  }
}

async function clearHistory() {
  if (!chatHistory.length || !chrome.storage?.local) return;
  if (!window.confirm('Clear all saved prompts and responses?')) return;

  try {
    await chrome.storage.local.remove(CHAT_HISTORY_KEY);
    chatHistory = [];
    renderHistory();
    setStatusMessage('History cleared.', 'success');
  } catch (error) {
    console.error('Failed to clear chat history', error);
    setStatusMessage('History could not be cleared.', 'error');
  }
}

function limitHistory(history) {
  const limited = [];
  let totalBytes = 0;

  for (const entry of history) {
    const normalized = normalizeHistoryEntry(entry);
    if (!normalized || limited.length >= MAX_HISTORY_ENTRIES) continue;

    const entryBytes = getUtf8ByteLength(JSON.stringify(normalized));
    if (totalBytes + entryBytes > MAX_HISTORY_BYTES) break;

    limited.push(normalized);
    totalBytes += entryBytes;
  }

  return limited;
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.prompt !== 'string' || typeof entry.response !== 'string') return null;

  return {
    prompt: entry.prompt,
    response: entry.response,
    framework: typeof entry.framework === 'string' ? entry.framework : '',
    createdAt: Number.isFinite(Number(entry.createdAt)) ? Number(entry.createdAt) : Date.now(),
  };
}

function getUtf8ByteLength(value) {
  return new TextEncoder().encode(value).byteLength;
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

function initializeHistorySidebar() {
  historySidebar.hidden = true;
  historyBackdrop.hidden = true;
  historySidebar.inert = true;
  historyBackdrop.inert = true;
  historySidebar.setAttribute('aria-hidden', 'true');
  historyBackdrop.setAttribute('aria-hidden', 'true');
}

function setHistorySidebarOpen(isOpen) {
  const wasOpen = historySidebar.classList.contains('is-open');
  if (isOpen && !wasOpen) {
    historyReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : historyToggleButton;
  }

  historySidebar.classList.toggle('is-open', isOpen);
  historyBackdrop.classList.toggle('is-open', isOpen);
  if (isOpen) {
    historySidebar.hidden = false;
    historyBackdrop.hidden = false;
    historySidebar.inert = false;
    historyBackdrop.inert = false;
  }

  historySidebar.setAttribute('aria-hidden', String(!isOpen));
  historyBackdrop.setAttribute('aria-hidden', String(!isOpen));
  historyToggleButton.setAttribute('aria-expanded', String(isOpen));

  if (!isOpen) {
    historySidebar.hidden = true;
    historyBackdrop.hidden = true;
    historySidebar.inert = true;
    historyBackdrop.inert = true;
    const focusTarget = historyReturnFocus;
    historyReturnFocus = null;
    if (focusTarget?.isConnected) {
      focusTarget.focus();
    } else {
      historyToggleButton.focus();
    }
    return;
  }

  window.requestAnimationFrame(() => historyCloseButton.focus());
}

function trapHistoryFocus(event) {
  const focusable = [...historySidebar.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute('hidden'));

  if (!focusable.length) {
    event.preventDefault();
    historyCloseButton.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function invalidateEnhancedResult() {
  if (!lastEnhanced && !lastEnhancedInput) return;
  lastEnhanced = '';
  lastEnhancedInput = '';
  output.textContent = '';
}

function setStatusMessage(message, state = 'info') {
  statusMessage.textContent = message || '';
  statusMessage.dataset.state = state;
  statusMessage.hidden = !message;
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
