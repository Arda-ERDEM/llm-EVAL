import { PageAgentBridge } from '../core/page-agent-bridge.js';

const bridge = new PageAgentBridge();

// Message listener for popup commands
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_PAGE') {
    bridge
      .capturePage()
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: String(err) });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'HIGHLIGHT_QUOTE') {
    const quote = message.quote as string;
    const found = highlightTextInPage(quote);
    sendResponse({ success: found });
    return true;
  }

  if (message.type === 'CLEAR_HIGHLIGHTS') {
    clearHighlights();
    sendResponse({ success: true });
    return true;
  }
});

let currentHighlightedEl: HTMLElement | null = null;

function highlightTextInPage(targetText: string): boolean {
  clearHighlights();

  if (!targetText || targetText.length < 5) return false;

  // Search text nodes in document body
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node: Node | null;

  // Search for the first 30 chars of the quote to locate the element
  const searchPrefix = targetText.slice(0, 35).toLowerCase();

  while ((node = walker.nextNode())) {
    const content = node.textContent?.toLowerCase() || '';
    if (content.includes(searchPrefix)) {
      const parent = node.parentElement;
      if (parent) {
        currentHighlightedEl = parent;
        parent.style.outline = '3px solid #ef4444';
        parent.style.backgroundColor = 'rgba(254, 240, 138, 0.4)';
        parent.style.transition = 'all 0.3s ease';
        parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
    }
  }

  return false;
}

function clearHighlights(): void {
  if (currentHighlightedEl) {
    currentHighlightedEl.style.outline = '';
    currentHighlightedEl.style.backgroundColor = '';
    currentHighlightedEl = null;
  }
}
