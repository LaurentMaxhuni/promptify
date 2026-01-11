const enhanceButton = document.getElementById('enhance-button');
const input = document.getElementById('input');
const output = document.getElementById('output');
const framework = document.getElementById('framework-select');
const copyButton = document.getElementById('copy-button');
let lastEnhanced = '';

enhanceButton.addEventListener('click', () => {
  if(!input.value) return;
  chrome.runtime.sendMessage(
    { type: "ENHANCE_TEXT", text: input.value, framework: framework.value},
    (response) => {
      const enhanced = response?.data?.choices?.[0]?.message?.content;
      if (!enhanced) return;
      lastEnhanced = enhanced;
      output.innerHTML = renderMarkdown(enhanced);
    }
  );
});

copyButton.addEventListener('click', () => {
  const text = lastEnhanced || input.value;
  if(!text) return;
  navigator.clipboard.writeText(text);
});

function renderMarkdown(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let inCodeBlock = false;
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
    if (/^\s*```/.test(line)) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
      } else {
        closeList();
        closeBlockquote();
        inCodeBlock = true;
        html.push("<pre><code>");
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
  const parts = text.split(/`/);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) {
        return `<code>${escapeHtml(part)}</code>`;
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
