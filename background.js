const CONNECTIONS_PATH = 'linkedin.com/mynetwork/invite-connect/connections/';

let state = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 1500
};

function isConnectionsPage(url) {
  return url && url.includes(CONNECTIONS_PATH);
}

function stopProcess() {
  if (state.tabId !== null) {
    chrome.scripting.executeScript({
      target: { tabId: state.tabId },
      func: () => {
        window.__liCleanerStop = true;
        window.__liCleanerPause = false;
      }
    });
  }
  state.status = 'stopped';
  state.tabId = null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === state.tabId && changeInfo.status === 'loading') {
    if (!isConnectionsPage(tab.url)) {
      stopProcess();
    }
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === state.tabId) {
    stopProcess();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'start':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (!tab) { sendResponse(); return; }
        const delay = message.delay || 1500;

        const startCleaner = () => {
          state.status = 'running';
          state.removed = 0;
          state.total = 0;
          state.tabId = tab.id;
          state.delay = delay;

          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              window.__liCleanerStop = false;
              window.__liCleanerPause = false;
            }
          });

          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: contentScript,
            args: [delay]
          });
          sendResponse({ status: state.status });
        };

        if (!isConnectionsPage(tab.url)) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => alert('Redirection vers la page de connexions...')
          });
          chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/' });
          const listener = (id, info, updatedTab) => {
            if (id === tab.id && info.status === 'complete' && isConnectionsPage(updatedTab.url)) {
              chrome.tabs.onUpdated.removeListener(listener);
              startCleaner();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
          sendResponse({ status: 'redirecting' });
        } else {
          startCleaner();
        }
      });
      return true;
    case 'status':
      sendResponse(state);
      break;
    case 'pause':
      if (state.tabId !== null) {
        const shouldPause = state.status === 'running';
        state.status = shouldPause ? 'paused' : 'running';
        chrome.scripting.executeScript({
          target: { tabId: state.tabId },
          func: p => { window.__liCleanerPause = p; },
          args: [shouldPause]
        });
      }
      break;
    case 'stop':
      stopProcess();
      break;
    case 'increment':
      state.removed += 1;
      break;
    case 'total':
      state.total = message.total;
      break;
    case 'completed':
      state.status = 'completed';
      state.tabId = null;
      break;
  }
});

function contentScript(delay) {
  if (!location.href.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
    chrome.runtime.sendMessage({ action: 'completed' });
    return;
  }

  window.__liCleanerPause = false;

  const cards = Array.from(document.querySelectorAll('li.mn-connection-card'));
  chrome.runtime.sendMessage({ action: 'total', total: cards.length });

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 500); }

  let i = 0;
  async function process() {
    if (window.__liCleanerStop) {
      chrome.runtime.sendMessage({ action: 'completed' });
      return;
    }
    if (window.__liCleanerPause) {
      setTimeout(process, 200);
      return;
    }
    if (i >= cards.length) {
      chrome.runtime.sendMessage({ action: 'completed' });
      return;
    }

    const card = cards[i];
    const moreBtn = card.querySelector(
      "button.mn-connection-card__dropdown-trigger, " +
      "button[aria-label*='More actions'], " +
      "button[aria-label*='Plus d\\u2019actions'], " +
      "button[aria-label*=\"Plus d'action\"]"
    );

    async function next() {
      i += 1;
      while (window.__liCleanerPause && !window.__liCleanerStop) {
        await wait(200);
      }
      await wait(randomDelay());
      process();
    }

    if (moreBtn) {
      moreBtn.click();
      await wait(500);
      const removeBtn = document.querySelector(
        "div.mn-connection-card__dropdown-item button[aria-label*='Remove connection'], " +
        "div.mn-connection-card__dropdown-item button[aria-label*='Retirer la relation'], " +
        "div.mn-connection-card__dropdown-item button[aria-label*='Supprimer la relation'], " +
        "div.mn-connection-card__dropdown-item button[aria-label*='Supprimer']"
      );
      if (removeBtn) {
        removeBtn.click();
        await wait(500);
        const confirmBtn = document.querySelector(
          "button.artdeco-button--danger, button[aria-label*='Remove'], button[aria-label*='Retirer'], button[aria-label*='Supprimer']"
        );
        if (confirmBtn) {
          confirmBtn.click();
        }
        chrome.runtime.sendMessage({ action: 'increment' });
        await next();
      } else {
        await next();
      }
    } else {
      await next();
    }
  }

  process();
}
