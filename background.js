function startCleaning(tabId, delay) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (d) => {
      (async function run(delay) {
        if (location.href.indexOf('linkedin.com/mynetwork/invite-connect/connections/') === -1) {
          alert('Redirection vers la page de connexions...');
          location.href = 'https://www.linkedin.com/mynetwork/invite-connect/connections/';
          return;
        }
        if (window.liCleaner && window.liCleaner.stop) {
          window.liCleaner.stop();
        }
        const wait = ms => new Promise(r => setTimeout(r, ms));
        async function waitForCards() {
          for (let i = 0; i < 20; i++) {
            const found = document.querySelectorAll('li.mn-connection-card');
            if (found.length) return Array.from(found);
            await wait(500);
          }
          return [];
        }
        const cards = await waitForCards();
        let index = 0;
        let paused = false;
        let stopped = false;
        window.liCleanerState = { status: 'running', removed: 0, total: cards.length };
        window.liCleaner = {
          pause() {
            paused = !paused;
            window.liCleanerState.status = paused ? 'paused' : 'running';
          },
          stop() {
            stopped = true;
            window.liCleanerState.status = 'stopped';
          }
        };
        const process = async () => {
          if (stopped) return;
          if (paused) { setTimeout(process, 500); return; }
          if (index >= cards.length) { window.liCleanerState.status = 'completed'; return; }
          const card = cards[index];
          const moreBtn = card.querySelector("button[aria-label*='More actions'], button[aria-label*='Plus d\u2019actions'], button[aria-label*=\"Plus d'action\"]");
          if (moreBtn) {
            moreBtn.click();
            await wait(500);
            const removeBtn = document.querySelector("div[role='menu'] button[aria-label*='Remove connection'], div[role='menu'] button[aria-label*='Retirer la relation'], div[role='menu'] button[aria-label*='Supprimer la relation']");
            if (removeBtn) {
              removeBtn.click();
              await wait(500);
              const confirmBtn = document.querySelector("button.artdeco-button--danger, button[aria-label*='Remove'], button[aria-label*='Retirer'], button[aria-label*='Supprimer']");
              if (confirmBtn) confirmBtn.click();
            }
          }
          index++;
          window.liCleanerState.removed = index;
          setTimeout(process, delay);
        };
        process();
      })(d);
    },
    args: [delay]
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (['start', 'pause', 'stop', 'status'].includes(message.action)) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (!tab) { sendResponse(); return; }
      if (message.action === 'start') {
        const correct = tab.url && tab.url.includes('linkedin.com/mynetwork/invite-connect/connections/');
        if (!correct) {
          chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => alert('Redirection vers la page de connexions...') });
          chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/' });
          chrome.tabs.onUpdated.addListener(function listener(id, info) {
            if (id === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              startCleaning(tab.id, message.delay);
            }
          });
          sendResponse({ status: 'redirecting' });
        } else {
          startCleaning(tab.id, message.delay);
          sendResponse({ status: 'running' });
        }
      } else if (message.action === 'pause') {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.liCleaner && window.liCleaner.pause(); } });
        sendResponse();
      } else if (message.action === 'stop') {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.liCleaner && window.liCleaner.stop(); } });
        sendResponse();
      } else if (message.action === 'status') {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.liCleanerState || null }, res => {
          sendResponse(res && res[0] ? res[0].result : null);
        });
        return true;
      }
    });
    return true;
  }
});
