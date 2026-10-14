// Chrome Extension Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('ToS Risk Radar extension installed successfully.');
});

// Relay messages between popup and active tab content script if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG' });
    return true;
  }
});
