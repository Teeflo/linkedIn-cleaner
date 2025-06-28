const CONNECTIONS_PATH = 'linkedin.com/mynetwork/invite-connect/connections/';
const PROFILE_PATH = 'linkedin.com/in/';

let state = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 1500
};

let postsState = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null
};

function isConnectionsPage(url) {
  return url && url.includes(CONNECTIONS_PATH);
}

function isProfilePage(url) {
  return url && url.includes(PROFILE_PATH);
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

function stopPostsProcess() {
  if (postsState.tabId !== null) {
    chrome.scripting.executeScript({
      target: { tabId: postsState.tabId },
      func: () => {
        window.__liCleanerStop = true;
        window.__liCleanerPause = false;
      }
    });
  }
  postsState.status = 'stopped';
  postsState.tabId = null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === state.tabId && changeInfo.status === 'loading') {
    if (!isConnectionsPage(tab.url)) {
      stopProcess();
    }
  }
  if (tabId === postsState.tabId && changeInfo.status === 'loading') {
    if (!isProfilePage(tab.url)) {
      stopPostsProcess();
    }
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === state.tabId) {
    stopProcess();
  }
  if (tabId === postsState.tabId) {
    stopPostsProcess();
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
        };

        if (!isConnectionsPage(tab.url)) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => confirm("You will be redirected to a new page. After the redirection, please click the 'Start' button again to continue the removal process.")
          }, results => {
            const proceed = results && results[0] && results[0].result;
            if (!proceed) {
              sendResponse({ status: 'idle' });
              return;
            }

            state.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isConnectionsPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startCleaner();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            sendResponse({ status: state.status });
          });
        } else {
          startCleaner();
          sendResponse({ status: state.status });
        }
      });
      return true;
    case 'startPosts':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (!tab) { sendResponse(); return; }

        const startPosts = () => {
          postsState.status = 'running';
          postsState.removed = 0;
          postsState.total = 0;
          postsState.tabId = tab.id;

          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              window.__liCleanerStop = false;
              window.__liCleanerPause = false;
            }
          });

          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: postsScript,
            args: []
          });
        };

        if (!isProfilePage(tab.url)) {
          sendResponse({ status: 'idle' });
          return;
        }

        startPosts();
        sendResponse({ status: postsState.status });
      });
      return true;
    case 'status':
      sendResponse(state);
      break;
    case 'statusPosts':
      sendResponse(postsState);
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
    case 'pausePosts':
      if (postsState.tabId !== null) {
        const shouldPause = postsState.status === 'running';
        postsState.status = shouldPause ? 'paused' : 'running';
        chrome.scripting.executeScript({
          target: { tabId: postsState.tabId },
          func: p => { window.__liCleanerPause = p; },
          args: [shouldPause]
        });
      }
      break;
    case 'stop':
      stopProcess();
      break;
    case 'stopPosts':
      stopPostsProcess();
      break;
    case 'increment':
      state.removed += 1;
      break;
    case 'incrementPosts':
      postsState.removed += 1;
      break;
    case 'total':
      state.total = message.total;
      break;
    case 'totalPosts':
      postsState.total = message.total;
      break;
    case 'completed':
      state.status = 'completed';
      state.tabId = null;
      break;
    case 'postsCompleted':
      postsState.status = 'completed';
      postsState.tabId = null;
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

function postsScript() {
  if (!location.href.includes('linkedin.com')) {
    chrome.runtime.sendMessage({ action: 'postsCompleted' });
    return;
  }

  window.__liCleanerPause = false;

  const posts = Array.from(document.querySelectorAll('div.feed-shared-update-v2'));
  chrome.runtime.sendMessage({ action: 'totalPosts', total: posts.length });

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return 2000 + Math.floor(Math.random() * 3000); }

  let i = 0;
  async function process() {
    if (window.__liCleanerStop) {
      chrome.runtime.sendMessage({ action: 'postsCompleted' });
      return;
    }
    if (window.__liCleanerPause) {
      setTimeout(process, 200);
      return;
    }
    if (i >= posts.length) {
      chrome.runtime.sendMessage({ action: 'postsCompleted' });
      return;
    }

    const post = posts[i];
    const menu = post.querySelector("button[aria-label*='More actions']");

    async function next() {
      i += 1;
      while (window.__liCleanerPause && !window.__liCleanerStop) {
        await wait(200);
      }
      await wait(randomDelay());
      process();
    }

    if (menu) {
      menu.click();
      await wait(500);
      const deleteBtn = document.querySelector("div[role='menu'] button[aria-label*='Delete']");
      if (deleteBtn) {
        deleteBtn.click();
        await wait(500);
        const confirmBtn = document.querySelector("button.artdeco-button--danger");
        if (confirmBtn) { confirmBtn.click(); }
        chrome.runtime.sendMessage({ action: 'incrementPosts' });
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
