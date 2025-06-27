function removeConnections() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function randomDelay() { return 1500 + Math.random() * 500; }
  if (!location.href.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
    alert('Veuillez naviguer vers votre page de connexions LinkedIn.');
    return;
  }
  const cards = Array.from(document.querySelectorAll('li.mn-connection-card'));
  (async () => {
    for (const card of cards) {
      const moreBtn = card.querySelector('button[aria-label*="More actions"], button[aria-label*="Plus d\u2019actions"]');
      if (moreBtn) {
        moreBtn.click();
        await wait(500);
        const removeBtn = document.querySelector('div[role="menu"] button[aria-label*="Remove connection"], div[role="menu"] button[aria-label*="Retirer la relation"]');
        if (removeBtn) {
          removeBtn.click();
          await wait(500);
          const confirmBtn = document.querySelector('button.artdeco-button--danger, button[aria-label*="Remove"], button[aria-label*="Retirer"]');
          if (confirmBtn) confirmBtn.click();
        }
      }
      await wait(randomDelay());
    }
  })();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'clean') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert('Veuillez naviguer vers votre page de connexions LinkedIn.')
        });
        sendResponse();
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: removeConnections
      });
      sendResponse();
    });
    return true;
  }
});
