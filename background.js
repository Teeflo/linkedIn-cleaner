const CONNECTIONS_PATH = 'linkedin.com/mynetwork/invite-connect/connections/';
const POSTS_PATH = '/recent-activity/all/';
const SENT_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/sent/';
const RECEIVED_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/';
const MESSAGES_PATH = 'linkedin.com/messaging/';

const defaultState = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 1500
};

const defaultPostsState = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 2000
};

const defaultSentInvState = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 1500
};

const defaultReceivedInvState = {
  status: 'idle',
  accepted: 0,
  ignored: 0,
  total: 0,
  tabId: null,
  delay: 1500,
  mode: null
};

const defaultMessagesState = {
  status: 'idle',
  removed: 0,
  total: 0,
  tabId: null,
  delay: 2000
};

let state = { ...defaultState };
let postsState = { ...defaultPostsState };
let sentInvState = { ...defaultSentInvState };
let receivedInvState = { ...defaultReceivedInvState };
let messagesState = { ...defaultMessagesState };

function saveAllStates() {
  chrome.storage.local.set({
    connectionsState: state,
    postsState,
    sentInvState,
    receivedInvState,
    messagesState
  });
}

chrome.storage.local.get(
  ['connectionsState', 'postsState', 'sentInvState', 'receivedInvState', 'messagesState'],
  data => {
    if (data.connectionsState) Object.assign(state, data.connectionsState);
    if (data.postsState) Object.assign(postsState, data.postsState);
    if (data.sentInvState) Object.assign(sentInvState, data.sentInvState);
    if (data.receivedInvState) Object.assign(receivedInvState, data.receivedInvState);
    if (data.messagesState) Object.assign(messagesState, data.messagesState);
  }
);

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

function isMessagesPage(url) {
  return url && url.includes(MESSAGES_PATH);
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
  saveAllStates();
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
  saveAllStates();
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
  saveAllStates();
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
  saveAllStates();
}

function stopMessagesProcess() {
  if (messagesState.tabId !== null) {
    execScript({
      target: { tabId: messagesState.tabId },
      func: () => {
        window.__liCleanerStop = true;
        window.__liCleanerPause = false;
      }
    });
  }
  messagesState.status = 'stopped';
  messagesState.tabId = null;
  saveAllStates();
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === state.tabId && changeInfo.status === 'loading') {
    if (!isConnectionsPage(tab.url)) stopProcess();
  }
  if (tabId === postsState.tabId && changeInfo.status === 'loading') {
    if (!isPostsPage(tab.url)) stopPostsProcess();
  }
  if (tabId === sentInvState.tabId && changeInfo.status === 'loading') {
    if (!isSentInvPage(tab.url)) stopSentInvProcess();
  }
  if (tabId === receivedInvState.tabId && changeInfo.status === 'loading') {
    if (!isReceivedInvPage(tab.url)) stopReceivedInvProcess();
  }
  if (tabId === messagesState.tabId && changeInfo.status === 'loading') {
    if (!isMessagesPage(tab.url)) stopMessagesProcess();
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === state.tabId) stopProcess();
  if (tabId === postsState.tabId) stopPostsProcess();
  if (tabId === sentInvState.tabId) stopSentInvProcess();
  if (tabId === receivedInvState.tabId) stopReceivedInvProcess();
  if (tabId === messagesState.tabId) stopMessagesProcess();
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
          saveAllStates();
          execScript({ target: { tabId: tab.id }, func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; } });
          execScript({ target: { tabId: tab.id }, func: contentScript, args: [delay] });
        };
        if (!isConnectionsPage(tab.url)) {
          execScript({ target: { tabId: tab.id }, func: () => confirm("Redirecting to Connections page. Click Start again after redirection.") }, results => {
            if (!results || !results[0] || !results[0].result) { sendResponse({ status: 'idle' }); return; }
            state.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isConnectionsPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startCleaner();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            saveAllStates();
            sendResponse({ status: state.status });
          });
        } else {
          startCleaner();
          saveAllStates();
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
          saveAllStates();
          execScript({ target: { tabId: tab.id }, func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; } });
          execScript({ target: { tabId: tab.id }, func: postsScript, args: [delay] });
        };
        const postsUrlMatch = tab.url.match(/linkedin\.com\/in\/([^\/]+)/);
        const handleRedirect = username => {
          execScript({ target: { tabId: tab.id }, func: () => confirm("Redirecting to Posts page. Click Start again after redirection.") }, results => {
            if (!results || !results[0] || !results[0].result) { sendResponse({ status: 'idle' }); return; }
            postsState.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: `https://www.linkedin.com/in/${username}/recent-activity/all/` });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isPostsPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startPosts();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            saveAllStates();
            sendResponse({ status: postsState.status });
          });
        };
        if (!isPostsPage(tab.url)) {
          if (postsUrlMatch) handleRedirect(postsUrlMatch[1]);
          else {
            execScript({ target: { tabId: tab.id }, func: () => { const link = Array.from(document.querySelectorAll('a[href*="/in/"]')).map(a => a.getAttribute('href')).find(h => /\/in\/[^/]+\/?$/.test(h || '')); return link || null; } }, res => {
              const url = res && res[0] && res[0].result;
              const match = url && url.match(/\/in\/([^/]+)/);
              if (match) handleRedirect(match[1]);
              else { execScript({ target: { tabId: tab.id }, func: () => alert('Please navigate to your LinkedIn profile first.') }); sendResponse({ status: 'idle' }); }
            });
          }
        } else {
          startPosts();
          saveAllStates();
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
          saveAllStates();
          execScript({ target: { tabId: tab.id }, func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; } });
          execScript({ target: { tabId: tab.id }, func: sentInvitationsScript, args: [delay] });
        };
        if (!isSentInvPage(tab.url)) {
          execScript({ target: { tabId: tab.id }, func: () => confirm("Redirecting to Sent Invites page. Click Start again after redirection.") }, results => {
            if (!results || !results[0] || !results[0].result) { sendResponse({ status: 'idle' }); return; }
            sentInvState.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invitation-manager/sent/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isSentInvPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startSent();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            saveAllStates();
            sendResponse({ status: sentInvState.status });
          });
        } else {
          startSent();
          saveAllStates();
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
          saveAllStates();
          execScript({ target: { tabId: tab.id }, func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; } });
          execScript({ target: { tabId: tab.id }, func: receivedInvitationsScript, args: [delay, mode] });
        };
        if (!isReceivedInvPage(tab.url)) {
          execScript({ target: { tabId: tab.id }, func: () => confirm("Redirecting to Received Invites. Click Start again after redirection.") }, results => {
            if (!results || !results[0] || !results[0].result) { sendResponse({ status: 'idle' }); return; }
            receivedInvState.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/mynetwork/invitation-manager/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isReceivedInvPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startReceived();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            saveAllStates();
            sendResponse({ status: receivedInvState.status });
          });
        } else {
          startReceived();
          saveAllStates();
          sendResponse({ status: receivedInvState.status });
        }
      });
      return true;

    case 'startMessages':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (!tab) { sendResponse(); return; }
        const delay = message.delay || 2000;
        const startMessages = () => {
          messagesState.status = 'running';
          messagesState.removed = 0;
          messagesState.total = 0;
          messagesState.tabId = tab.id;
          messagesState.delay = delay;
          saveAllStates();
          execScript({ target: { tabId: tab.id }, func: () => { window.__liCleanerStop = false; window.__liCleanerPause = false; } });
          execScript({ target: { tabId: tab.id }, func: messagesScript, args: [delay] });
        };
        if (!isMessagesPage(tab.url)) {
          execScript({ target: { tabId: tab.id }, func: () => confirm("Redirecting to Messages. Click Start again after redirection.") }, results => {
            if (!results || !results[0] || !results[0].result) { sendResponse({ status: 'idle' }); return; }
            messagesState.status = 'redirecting';
            chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/messaging/' });
            const listener = (id, info, updatedTab) => {
              if (id === tab.id && info.status === 'complete' && isMessagesPage(updatedTab.url)) {
                chrome.tabs.onUpdated.removeListener(listener);
                startMessages();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            saveAllStates();
            sendResponse({ status: messagesState.status });
          });
        } else {
          startMessages();
          saveAllStates();
          sendResponse({ status: messagesState.status });
        }
      });
      return true;

    case 'status': sendResponse(state); break;
    case 'statusPosts': sendResponse(postsState); break;
    case 'statusSent': sendResponse(sentInvState); break;
    case 'statusReceived': sendResponse(receivedInvState); break;
    case 'statusMessages': sendResponse(messagesState); break;

    case 'pause':
      if (state.tabId !== null) {
        state.status = (state.status === 'running') ? 'paused' : 'running';
        execScript({ target: { tabId: state.tabId }, func: p => { window.__liCleanerPause = p; }, args: [state.status === 'paused'] });
        saveAllStates();
      }
      break;
    case 'pausePosts':
      if (postsState.tabId !== null) {
        postsState.status = (postsState.status === 'running') ? 'paused' : 'running';
        execScript({ target: { tabId: postsState.tabId }, func: p => { window.__liCleanerPause = p; }, args: [postsState.status === 'paused'] });
        saveAllStates();
      }
      break;
    case 'pauseSent':
      if (sentInvState.tabId !== null) {
        sentInvState.status = (sentInvState.status === 'running') ? 'paused' : 'running';
        execScript({ target: { tabId: sentInvState.tabId }, func: p => { window.__liCleanerPause = p; }, args: [sentInvState.status === 'paused'] });
        saveAllStates();
      }
      break;
    case 'pauseReceived':
      if (receivedInvState.tabId !== null) {
        receivedInvState.status = (receivedInvState.status === 'running') ? 'paused' : 'running';
        execScript({ target: { tabId: receivedInvState.tabId }, func: p => { window.__liCleanerPause = p; }, args: [receivedInvState.status === 'paused'] });
        saveAllStates();
      }
      break;
    case 'pauseMessages':
      if (messagesState.tabId !== null) {
        messagesState.status = (messagesState.status === 'running') ? 'paused' : 'running';
        execScript({ target: { tabId: messagesState.tabId }, func: p => { window.__liCleanerPause = p; }, args: [messagesState.status === 'paused'] });
        saveAllStates();
      }
      break;

    case 'stop': stopProcess(); break;
    case 'stopPosts': stopPostsProcess(); break;
    case 'stopSent': stopSentInvProcess(); break;
    case 'stopReceived': stopReceivedInvProcess(); break;
    case 'stopMessages': stopMessagesProcess(); break;

    case 'increment': state.removed += 1; saveAllStates(); break;
    case 'incrementPosts': postsState.removed += 1; saveAllStates(); break;
    case 'incrementSent': sentInvState.removed += 1; saveAllStates(); break;
    case 'incrementAccepted': receivedInvState.accepted += 1; saveAllStates(); break;
    case 'incrementIgnored': receivedInvState.ignored += 1; saveAllStates(); break;
    case 'incrementMessages': messagesState.removed += 1; saveAllStates(); break;

    case 'total': state.total = message.total; saveAllStates(); break;
    case 'totalPosts': postsState.total = message.total; saveAllStates(); break;
    case 'totalSent': sentInvState.total = message.total; saveAllStates(); break;
    case 'totalReceived': receivedInvState.total = message.total; saveAllStates(); break;
    case 'totalMessages': messagesState.total = message.total; saveAllStates(); break;

    case 'completed': state.status = 'completed'; state.tabId = null; saveAllStates(); break;
    case 'postsCompleted': postsState.status = 'completed'; postsState.tabId = null; saveAllStates(); break;
    case 'sentCompleted': sentInvState.status = 'completed'; sentInvState.tabId = null; saveAllStates(); break;
    case 'receivedCompleted': receivedInvState.status = 'completed'; receivedInvState.tabId = null; receivedInvState.mode = null; saveAllStates(); break;
    case 'messagesCompleted': messagesState.status = 'completed'; messagesState.tabId = null; saveAllStates(); break;

    case 'resetState':
      state = { ...defaultState };
      postsState = { ...defaultPostsState };
      sentInvState = { ...defaultSentInvState };
      receivedInvState = { ...defaultReceivedInvState };
      messagesState = { ...defaultMessagesState };
      chrome.storage.local.remove(['connectionsState', 'postsState', 'sentInvState', 'receivedInvState', 'messagesState', 'selectedMode']);
      saveAllStates();
      break;
  }
});

function contentScript(delay) {
  if (!location.href.includes('linkedin.com/mynetwork/invite-connect/connections/')) { chrome.runtime.sendMessage({ action: 'completed' }); return; }
  window.__liCleanerPause = false;
  const cards = Array.from(document.querySelectorAll('li.mn-connection-card'));
  chrome.runtime.sendMessage({ action: 'total', total: cards.length });
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 500); }
  let i = 0;
  async function process() {
    if (window.__liCleanerStop) { chrome.runtime.sendMessage({ action: 'completed' }); return; }
    if (window.__liCleanerPause) { setTimeout(process, 200); return; }
    if (i >= cards.length) { chrome.runtime.sendMessage({ action: 'completed' }); return; }
    const card = cards[i];
    const moreBtn = card.querySelector("button.mn-connection-card__dropdown-trigger, button[aria-label*='More actions'], button[aria-label*='Plus d\\u2019actions'], button[aria-label*=\"Plus d'action\"]");
    async function next() { i += 1; while (window.__liCleanerPause && !window.__liCleanerStop) await wait(200); await wait(randomDelay()); process(); }
    if (moreBtn) {
      moreBtn.click(); await wait(500);
      const removeBtn = document.querySelector("div.mn-connection-card__dropdown-item button[aria-label*='Remove connection'], div.mn-connection-card__dropdown-item button[aria-label*='Retirer la relation'], div.mn-connection-card__dropdown-item button[aria-label*='Supprimer la relation'], div.mn-connection-card__dropdown-item button[aria-label*='Supprimer']");
      if (removeBtn) {
        removeBtn.click(); await wait(500);
        const confirmBtn = document.querySelector("button.artdeco-button--danger, button[aria-label*='Remove'], button[aria-label*='Retirer'], button[aria-label*='Supprimer']");
        if (confirmBtn) confirmBtn.click();
        chrome.runtime.sendMessage({ action: 'increment' }); await next();
      } else await next();
    } else await next();
  }
  process();
}

function postsScript(delay) {
  delay = delay || 2000;
  if (!/linkedin\.com\/in\/[^/]+\/recent-activity\/all\//.test(location.href)) { chrome.runtime.sendMessage({ action: 'postsCompleted' }); return; }
  window.__liCleanerPause = false;
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 3000); }
  async function loadAll() {
    let prevHeight = 0; let stable = 0;
    while (stable < 3) {
      window.scrollTo(0, document.body.scrollHeight); await wait(1000);
      if (document.body.scrollHeight === prevHeight) stable += 1; else { stable = 0; prevHeight = document.body.scrollHeight; }
    }
  }
  async function start() {
    await loadAll();
    const posts = Array.from(document.querySelectorAll('div.feed-shared-update-v2'));
    chrome.runtime.sendMessage({ action: 'totalPosts', total: posts.length });
    let i = 0;
    async function process() {
      if (window.__liCleanerStop) { chrome.runtime.sendMessage({ action: 'postsCompleted' }); return; }
      if (window.__liCleanerPause) { setTimeout(process, 200); return; }
      if (i >= posts.length) { chrome.runtime.sendMessage({ action: 'postsCompleted' }); return; }
      const post = posts[i];
      const menu = post.querySelector("button.feed-shared-control-menu__trigger.artdeco-button.artdeco-button--tertiary.artdeco-button--muted.artdeco-button--1.artdeco-button--circle");
      async function next() { i += 1; while (window.__liCleanerPause && !window.__liCleanerStop) await wait(200); await wait(randomDelay()); process(); }
      if (menu) {
        menu.click(); await wait(500);
        const deleteBtn = Array.from(document.querySelectorAll("div.feed-shared-control-menu__dropdown-item[role='button']")).find(el => /Supprimer|Delete/i.test(el.innerText));
        if (deleteBtn) {
          deleteBtn.click(); await wait(500);
          const confirmBtn = Array.from(document.querySelectorAll("button.artdeco-button--primary.artdeco-button--2")).find(el => /Supprimer|Delete/i.test(el.innerText));
          if (confirmBtn) confirmBtn.click();
          chrome.runtime.sendMessage({ action: 'incrementPosts' }); await next();
        } else await next();
      } else await next();
    }
    process();
  }
  start();
}

function sentInvitationsScript(delay) {
  const SENT_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/sent/';
  delay = delay || 1500;
  if (!location.href.includes(SENT_INV_PATH)) { chrome.runtime.sendMessage({ action: 'sentCompleted' }); return; }
  window.__liCleanerPause = false;
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 2000); }
  async function loadAll() {
    let prevCount = 0; let stable = 0;
    while (stable < 3) {
      window.scrollTo(0, document.body.scrollHeight); await wait(800);
      const loadMore = Array.from(document.querySelectorAll('button')).find(b => /load|voir|plus|more/i.test(b.innerText));
      if (loadMore) { loadMore.click(); await wait(800); }
      const count = document.querySelectorAll("button[data-view-name='sent-invitations-withdraw-single']").length;
      if (count === prevCount) stable += 1; else { stable = 0; prevCount = count; }
    }
  }
  async function start() {
    chrome.runtime.sendMessage({ action: 'sentLoading' });
    await loadAll();
    chrome.runtime.sendMessage({ action: 'sentLoaded' });
    const withdrawBtns = Array.from(document.querySelectorAll("button[data-view-name='sent-invitations-withdraw-single']"));
    chrome.runtime.sendMessage({ action: 'totalSent', total: withdrawBtns.length });
    let i = 0;
    async function process() {
      if (window.__liCleanerStop) { chrome.runtime.sendMessage({ action: 'sentCompleted' }); return; }
      if (window.__liCleanerPause) { setTimeout(process, 200); return; }
      if (i >= withdrawBtns.length) { chrome.runtime.sendMessage({ action: 'sentCompleted' }); return; }
      const btn = withdrawBtns[i];
      async function next() { i += 1; while (window.__liCleanerPause && !window.__liCleanerStop) await wait(200); await wait(randomDelay()); process(); }
      btn.click(); await wait(600);
      const confirmBtn = document.querySelector("button.artdeco-button--primary");
      if (confirmBtn && /Retirer|Withdraw/i.test(confirmBtn.innerText)) {
        confirmBtn.click();
        chrome.runtime.sendMessage({ action: 'incrementSent' });
        await next();
      } else await next();
    }
    process();
  }
  start();
}

function receivedInvitationsScript(delay, mode) {
  const RECEIVED_INV_PATH = 'linkedin.com/mynetwork/invitation-manager/';
  delay = delay || 1500;
  if (!location.href.includes(RECEIVED_INV_PATH) || location.href.includes('/sent/')) { chrome.runtime.sendMessage({ action: 'receivedCompleted' }); return; }
  window.__liCleanerPause = false;
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 2000); }
  async function start() {
    const invites = Array.from(document.querySelectorAll('li.invitation-card'));
    chrome.runtime.sendMessage({ action: 'totalReceived', total: invites.length });
    let i = 0;
    async function process() {
      if (window.__liCleanerStop) { chrome.runtime.sendMessage({ action: 'receivedCompleted' }); return; }
      if (window.__liCleanerPause) { setTimeout(process, 200); return; }
      if (i >= invites.length) { chrome.runtime.sendMessage({ action: 'receivedCompleted' }); return; }
      const invite = invites[i];
      let btn = null;
      if (mode === 'accept') { btn = invite.querySelector("button.artdeco-button--secondary"); }
      else { btn = invite.querySelector("button.artdeco-button--tertiary"); }
      async function next() { i += 1; while (window.__liCleanerPause && !window.__liCleanerStop) await wait(200); await wait(randomDelay()); process(); }
      if (btn) {
        btn.click();
        if (mode === 'accept') chrome.runtime.sendMessage({ action: 'incrementAccepted' });
        else chrome.runtime.sendMessage({ action: 'incrementIgnored' });
        await next();
      } else await next();
    }
    process();
  }
  start();
}

function messagesScript(delay) {
  const MESSAGES_PATH = 'linkedin.com/messaging/';
  delay = delay || 2000;
  if (!location.href.includes(MESSAGES_PATH)) { chrome.runtime.sendMessage({ action: 'messagesCompleted' }); return; }
  window.__liCleanerPause = false;
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function randomDelay() { return delay + Math.floor(Math.random() * 1000); }

  // Wait for conversations to load
  async function start() {
    // Correct selector from subagent
    const listSelector = '.msg-conversations-container__conversations-list';

    // Check if list exists. If not, wait.
    let listElement = document.querySelector(listSelector);
    if (!listElement) {
      await wait(2000);
      listElement = document.querySelector(listSelector);
      if (!listElement) {
        chrome.runtime.sendMessage({ action: 'messagesCompleted' });
        return;
      }
    }

    // Scroll to load all conversations (capped at reasonable limit to avoid infinite loops)
    let prevScrollHeight = 0;
    let stable = 0;
    let maxScrolls = 50;

    // Ensure we have the element before scrolling
    if (!listElement) {
      listElement = document.querySelector('.msg-conversations-container__conversations-list');
      if (!listElement) {
        console.log("List element not found for scrolling");
        chrome.runtime.sendMessage({ action: 'messagesCompleted' });
        return;
      }
    }

    while (stable < 3 && maxScrolls > 0) {
      listElement.scrollTop = listElement.scrollHeight;
      await wait(1500);
      if (listElement.scrollHeight === prevScrollHeight) {
        stable += 1;
      } else {
        stable = 0;
        prevScrollHeight = listElement.scrollHeight;
      }
      maxScrolls--;
    }

    const allCards = document.querySelectorAll('.msg-conversation-listitem');
    chrome.runtime.sendMessage({ action: 'totalMessages', total: allCards.length });

    // Scroll back to top
    listElement.scrollTop = 0;
    await wait(1000);

    async function process() {
      if (window.__liCleanerStop) { chrome.runtime.sendMessage({ action: 'messagesCompleted' }); return; }
      if (window.__liCleanerPause) { setTimeout(process, 200); return; }

      const conversationCards = document.querySelectorAll('.msg-conversation-listitem');
      if (conversationCards.length === 0) { chrome.runtime.sendMessage({ action: 'messagesCompleted' }); return; }

      const card = conversationCards[0]; // Always take top one
      // Click the card to make sure it's active/focused (sometimes needed for menu to work reliably)
      const link = card.querySelector('a');
      if (link) link.click();
      await wait(500);

      // Find '...' button on the card (often hidden until hover, but triggering click usually works if element exists)
      const dropdownTrigger = card.querySelector('.msg-thread-actions__control') ||
        card.querySelector('button[data-test-icon="overflow-web-ios-medium"]') ||
        card.querySelector('.msg-conversation-card__trigger') ||
        card.querySelector('button[aria-label*="More actions"]');

      if (dropdownTrigger) {
        dropdownTrigger.click();
        await wait(500);

        // Find Delete button in dropdown
        const deleteBtn = Array.from(document.querySelectorAll('.msg-thread-actions__dropdown-option, div[role="button"], li[role="button"], button')).find(el =>
          /Delete|Supprimer/i.test(el.innerText) && el.offsetParent !== null
        );

        if (deleteBtn) {
          deleteBtn.click();
          await wait(500);

          // Confirm Modal
          const confirmBtn = Array.from(document.querySelectorAll('.artdeco-modal .artdeco-button--primary')).find(el =>
            /Delete|Supprimer|Yes|Oui/i.test(el.innerText)
          );

          if (confirmBtn) {
            confirmBtn.click();
            chrome.runtime.sendMessage({ action: 'incrementMessages' });
            // Use a longer delay allow UI to refresh
            await wait(1000 + randomDelay());
            process();
          } else {
            console.log('Confirmation button not found');
            await wait(2000);
            process();
          }
        } else {
          console.log('Delete button not found in menu');
          chrome.runtime.sendMessage({ action: 'messagesCompleted' });
          return;
        }

      } else {
        // No dropdown trigger
        chrome.runtime.sendMessage({ action: 'messagesCompleted' });
        return;
      }
    }
    process();
  }
  start();
}
