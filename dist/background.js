"use strict";
(() => {
  // src/extension/background.ts
  chrome.runtime.onInstalled.addListener(() => {
    console.log("ToS Risk Radar extension installed successfully.");
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ status: "PONG" });
      return true;
    }
  });
})();
//# sourceMappingURL=background.js.map
