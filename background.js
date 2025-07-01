const CONNECTIONS_PATH = 'linkedin.com/mynetwork/invite-connect/connections/';
const POSTS_PATH = '/recent-activity/all/';
const SENT_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/sent/';
const RECEIVED_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/';

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
  tabId: null,
  delay: 2000
};

let sentInvState = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 1500
};

let receivedInvState = {
  status: 'idle',
  accepted: 0,
  ignored: 0,
  total: 0,
  tabId: null,
  delay: 1500,
  mode: null
};

function isConnectionsPage(url) {
  return url && url.includes(CONNECTIONS_PATH);
}

function isPostsPage(url) {
  return url && /linkedin\.com\/in\/[^\/]+\/recent-activity\/all\//.test(url);
}

function isSentInvPage(url) {
  return url && url.includes(SENT_INV_PATH);
}

function isReceivedInvPage(url) {
  return url && url.includes(RECEIVED_INV_PATH) && !url.includes('/sent/');
}

function execScript(injection, callback) {
  chrome.scripting.executeScript(injection, (...args) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }
    if (callback) callback(...args);
  });
}

function stopProcess() {
  if (state.tabId !== null) {
    execScript({
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
    execScript({
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

function stopSentInvProcess() {
  if (sentInvState.tabId !== null) {
    execScript({
      target: { tabId: sentInvState.tabId },
      func: () => {
        window.__liCleanerStop = true;
        window.__liCleanerPause = false;
      }
    });
  }
  sentInvState.status = 'stopped';
  sentInvState.tabId = null;
}

function stopReceivedInvProcess() {
  if (receivedInvState.tabId !== null) {
    execScript({
      target: { tabId: receivedInvState.tabId },
      func: () => {
        window.__liCleanerStop = true;
        window.__liCleanerPause = false;
      }
    });
  }
  receivedInvState.status = 'stopped';
  receivedInvState.tabId = null;
  receivedInvState.mode = null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === state.tabId && changeInfo.status === 'loading') {
    if (!isConnectionsPage(tab.url)) {
      stopProcess();
    }
  }
  if (tabId === postsState.tabId && changeInfo.status === 'loading') {
    if (!isPostsPage(tab.url)) {
      stopPostsProcess();
    }
  }
  if (tabId === sentInvState.tabId && changeInfo.status === 'loading') {
    if (!isSentInvPage(tab.url)) {
      stopSentInvProcess();
    }
  }
  if (tabId === receivedInvState.tabId && changeInfo.status === 'loading') {
    if (!isReceivedInvPage(tab.url)) {
      stopReceivedInvProcess();
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
  if (tabId === sentInvState.tabId) {
    stopSentInvProcess();
  }
  if (tabId === receivedInvState.tabId) {
    stopReceivedInvProcess();
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

          execScript({
            target: { tabId: tab.id },
            func: () => {
              window.__liCleanerStop = false;
              window.__liCleanerPause = false;
            }
          });

          execScript({
            target: { tabId: tab.id },
            func: contentScript,
            args: [delay]
          });
        };

        if (!isConnectionsPage(tab.url)) {
          execScript({
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
        const delay = message.delay || 2000;

        const startPosts = () => {
          postsState.status = 'running';
          postsState.removed = 0;
          postsState.total = 0;
          postsState.tabId = tab.id;
          postsState.delay = delay;

          execScript({
            target: { tabId: tab.id },
            func: () => {
              window.__liCleanerStop = false;
              window.__liCleanerPause = false;
            }
          });

          execScript({
            target: { tabId: tab.id },
            func: postsScript,
            args: [delay]
          });
        };

        const postsUrlMatch = tab.url.match(/linkedin\.com\/in\/([^\/]+)/);
        const handleRedirect = username => {
          execScript({
            target: { tabId: tab.id },
            func: () => confirm("You will be redirected to your posts page. After the redirection, please click 'Start' again to continue the deletion process.")
          }, results => {
            const proceed = results && results[0] && results[0].result;
            if (!proceed) {
              sendResponse({ status: 'idle' });
              return;
            }

            postsState.status = 'redirecting';
            const postsUrl = `https://www.linkedin.com/in/${username}/recent-activity/all/`;
            chrome.tabs.update(tab.id, { url: postsUrl });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isPostsPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startPosts();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            sendResponse({ status: postsState.status });
          });
        };

        if (!isPostsPage(tab.url)) {
          if (postsUrlMatch) {
            handleRedirect(postsUrlMatch[1]);
          } else {
            execScript({
              target: { tabId: tab.id },
              func: () => {
                const link = Array.from(document.querySelectorAll('a[href*="/in/"]'))
                  .map(a => a.getAttribute('href'))
                  .find(h => /\/in\/[^/]+\/?$/.test(h || ''));
                return link || null;
              }
            }, res => {
              const url = res && res[0] && res[0].result;
              const match = url && url.match(/\/in\/([^/]+)/);
              if (match) {
                handleRedirect(match[1]);
              } else {
                execScript({
                  target: { tabId: tab.id },
                  func: () => alert('Please navigate to your LinkedIn profile first.')
                });
                sendResponse({ status: 'idle' });
              }
            });
          }
        } else {
          startPosts();
          sendResponse({ status: postsState.status });
        }
      });
      return true;
    case 'startSent':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (!tab) { sendResponse(); return; }
        const delay = message.delay || 1500;

        const startSent = () => {
          sentInvState.status = 'running';
          sentInvState.removed = 0;
          sentInvState.total = 0;
          sentInvState.tabId = tab.id;
          sentInvState.delay = delay;

          execScript({
            target: { tabId: tab.id },
            func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; }
          });

          execScript({
            target: { tabId: tab.id },
            func: sentInvitationsScript,
            args: [delay]
          });
        };

        if (!isSentInvPage(tab.url)) {
          execScript({
            target: { tabId: tab.id },
            func: () => confirm("You will be redirected to your sent invitations. After the redirection, please click 'Start' again.")
          }, results => {
            const proceed = results && results[0] && results[0].result;
            if (!proceed) { sendResponse({ status: 'idle' }); return; }

            sentInvState.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invitation-manager/sent/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isSentInvPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startSent();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            sendResponse({ status: sentInvState.status });
          });
        } else {
          startSent();
          sendResponse({ status: sentInvState.status });
        }
      });
      return true;
    case 'startReceived':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (!tab) { sendResponse(); return; }
        const delay = message.delay || 1500;
        const mode = message.mode === 'ignore' ? 'ignore' : 'accept';

        const startReceived = () => {
          receivedInvState.status = 'running';
          receivedInvState.accepted = 0;
          receivedInvState.ignored = 0;
          receivedInvState.total = 0;
          receivedInvState.tabId = tab.id;
          receivedInvState.delay = delay;
          receivedInvState.mode = mode;

          execScript({
            target: { tabId: tab.id },
            func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; }
          });

          execScript({
            target: { tabId: tab.id },
            func: receivedInvitationsScript,
            args: [delay, mode]
          });
        };

        if (!isReceivedInvPage(tab.url)) {
          execScript({
            target: { tabId: tab.id },
            func: () => confirm("You will be redirected to your received invitations. After the redirection, please click 'Start' again.")
          }, results => {
            const proceed = results && results[0] && results[0].result;
            if (!proceed) { sendResponse({ status: 'idle' }); return; }

            receivedInvState.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invitation-manager/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isReceivedInvPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startReceived();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            sendResponse({ status: receivedInvState.status });
          });
        } else {
          startReceived();
          sendResponse({ status: receivedInvState.status });
        }
      });
      return true;
    case 'status':
      sendResponse(state);
      break;
    case 'statusPosts':
      sendResponse(postsState);
      break;
    case 'statusSent':
      sendResponse(sentInvState);
      break;
    case 'statusReceived':
      sendResponse(receivedInvState);
      break;
    case 'pause':
      if (state.tabId !== null) {
        const shouldPause = state.status === 'running';
        state.status = shouldPause ? 'paused' : 'running';
        execScript({
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
        execScript({
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
    case 'pauseSent':
      if (sentInvState.tabId !== null) {
        const shouldPause = sentInvState.status === 'running';
        sentInvState.status = shouldPause ? 'paused' : 'running';
        execScript({
          target: { tabId: sentInvState.tabId },
          func: p => { window.__liCleanerPause = p; },
          args: [shouldPause]
        });
      }
      break;
    case 'pauseReceived':
      if (receivedInvState.tabId !== null) {
        const shouldPause = receivedInvState.status === 'running';
        receivedInvState.status = shouldPause ? 'paused' : 'running';
        execScript({
          target: { tabId: receivedInvState.tabId },
          func: p => { window.__liCleanerPause = p; },
          args: [shouldPause]
        });
      }
      break;
    case 'stopSent':
      stopSentInvProcess();
      break;
    case 'stopReceived':
      stopReceivedInvProcess();
      break;
    case 'increment':
      state.removed += 1;
      break;
    case 'incrementPosts':
      postsState.removed += 1;
      break;
    case 'incrementSent':
      sentInvState.removed += 1;
      break;
    case 'incrementAccepted':
      receivedInvState.accepted += 1;
      break;
    case 'incrementIgnored':
      receivedInvState.ignored += 1;
      break;
    case 'total':
      state.total = message.total;
      break;
    case 'totalPosts':
      postsState.total = message.total;
      break;
    case 'totalSent':
      sentInvState.total = message.total;
      break;
    case 'totalReceived':
      receivedInvState.total = message.total;
      break;
    case 'completed':
      state.status = 'completed';
      state.tabId = null;
      break;
    case 'postsCompleted':
      postsState.status = 'completed';
      postsState.tabId = null;
      break;
    case 'sentCompleted':
      sentInvState.status = 'completed';
      sentInvState.tabId = null;
      break;
    case 'receivedCompleted':
      receivedInvState.status = 'completed';
      receivedInvState.tabId = null;
      receivedInvState.mode = null;
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

function postsScript(delay) {
  delay = delay || 2000;
  if (!/linkedin\.com\/in\/[^/]+\/recent-activity\/all\//.test(location.href)) {
    chrome.runtime.sendMessage({ action: 'postsCompleted' });
    return;
  }

  window.__liCleanerPause = false;

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 3000); }

  async function loadAll() {
    let prevHeight = 0;
    let stable = 0;
    while (stable < 3) {
      window.scrollTo(0, document.body.scrollHeight);
      await wait(1000);
      if (document.body.scrollHeight === prevHeight) {
        stable += 1;
      } else {
        stable = 0;
        prevHeight = document.body.scrollHeight;
      }
    }
  }

  async function start() {
    await loadAll();
    const posts = Array.from(document.querySelectorAll('div.feed-shared-update-v2'));
    chrome.runtime.sendMessage({ action: 'totalPosts', total: posts.length });

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
      const menu = post.querySelector("button.feed-shared-control-menu__trigger.artdeco-button.artdeco-button--tertiary.artdeco-button--muted.artdeco-button--1.artdeco-button--circle");

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
        const deleteBtn = Array.from(
          document.querySelectorAll(
            "div.feed-shared-control-menu__dropdown-item[role='button']"
          )
        ).find(el => /Supprimer|Delete/i.test(el.innerText));
        if (deleteBtn) {
          deleteBtn.click();
          await wait(500);
          const confirmBtn = Array.from(
            document.querySelectorAll(
              "button.artdeco-button--primary.artdeco-button--2"
            )
          ).find(el => /Supprimer|Delete/i.test(el.innerText));
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

  start();
}

function sentInvitationsScript(delay) {
  const SENT_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/sent/';
  delay = delay || 1500;
  if (!location.href.includes(SENT_INV_PATH)) {
    chrome.runtime.sendMessage({ action: 'sentCompleted' });
    return;
  }

  window.__liCleanerPause = false;

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 2000); }

  async function loadAll() {
    let prevCount = 0;
    let stable = 0;
    while (stable < 3) {
      window.scrollTo(0, document.body.scrollHeight);
      await wait(800);
      const loadMore = Array.from(document.querySelectorAll('button'))
        .find(b => /load|voir|plus|more/i.test(b.innerText));
      if (loadMore) {
        loadMore.click();
        await wait(800);
      }
      const count = document.querySelectorAll("button[data-view-name='sent-invitations-withdraw-single']").length;
      if (count === prevCount) {
        stable += 1;
      } else {
        stable = 0;
        prevCount = count;
      }
    }
  }

  async function start() {
    await loadAll();
    const buttons = Array.from(
      document.querySelectorAll("button[data-view-name='sent-invitations-withdraw-single']")
    );
    chrome.runtime.sendMessage({ action: 'totalSent', total: buttons.length });

  let i = 0;
  async function process() {
    if (window.__liCleanerStop) {
      chrome.runtime.sendMessage({ action: 'sentCompleted' });
      return;
    }
    if (window.__liCleanerPause) { setTimeout(process, 200); return; }
    if (i >= buttons.length) {
      chrome.runtime.sendMessage({ action: 'sentCompleted' });
      return;
    }

    const btn = buttons[i];

    async function next() {
      i += 1;
      while (window.__liCleanerPause && !window.__liCleanerStop) { await wait(200); }
      await wait(randomDelay());
      process();
    }

    if (btn && btn.offsetParent !== null) {
      btn.click();
      await wait(500);
      const confirmBtn = Array.from(document.querySelectorAll('button'))
        .find(b => /Retirer|Withdraw|Supprimer/i.test(b.innerText));
      if (confirmBtn) { confirmBtn.click(); }
      chrome.runtime.sendMessage({ action: 'incrementSent' });
      await next();
    } else {
      await next();
    }
  }

    process();
  }

  start();
}

function receivedInvitationsScript(delay, mode) {
  const RECEIVED_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/';
  delay = delay || 1500;
  function isReceivedInvPageLocal(url) {
    return url && url.includes(RECEIVED_INV_PATH) && !url.includes('/sent/');
  }
  if (!isReceivedInvPageLocal(location.href)) {
    chrome.runtime.sendMessage({ action: 'receivedCompleted' });
    return;
  }

  window.__liCleanerPause = false;

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 2000); }

  const cards = Array.from(document.querySelectorAll('li.invitation-card'));
  chrome.runtime.sendMessage({ action: 'totalReceived', total: cards.length });

  let i = 0;
  async function process() {
    if (window.__liCleanerStop) {
      chrome.runtime.sendMessage({ action: 'receivedCompleted' });
      return;
    }
    if (window.__liCleanerPause) { setTimeout(process, 200); return; }
    if (i >= cards.length) {
      chrome.runtime.sendMessage({ action: 'receivedCompleted' });
      return;
    }

    const card = cards[i];
    const btn = Array.from(card.querySelectorAll('button')).find(b => {
      return mode === 'accept' ? /Accepter|Accept/i.test(b.innerText) : /Ignorer|Ignore/i.test(b.innerText);
    });

    async function next() {
      i += 1;
      while (window.__liCleanerPause && !window.__liCleanerStop) { await wait(200); }
      await wait(randomDelay());
      process();
    }

    if (btn) {
      btn.click();
      await wait(500);
      const confirmBtn = Array.from(document.querySelectorAll('button'))
        .find(b => /Retirer|Remove|Supprimer/i.test(b.innerText));
      if (confirmBtn) { confirmBtn.click(); }
      chrome.runtime.sendMessage({ action: mode === 'accept' ? 'incrementAccepted' : 'incrementIgnored' });
      await next();
    } else {
      await next();
    }
  }

  process();
}
