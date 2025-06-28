const FEED_URL = 'https://mail.google.com/mail/feed/atom';
const DEFAULT_INTERVAL = 60; // seconds
let timer = null;
let latestItems = [];

async function fetchFeed() {
  try {
    const res = await fetch(FEED_URL, { credentials: 'include' });
    if (!res.ok) return null;
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const count = parseInt(xml.querySelector('fullcount').textContent, 10);
    const entries = Array.from(xml.querySelectorAll('entry')).map(e => ({
      title: e.querySelector('title').textContent,
      author: e.querySelector('author > name').textContent,
      summary: e.querySelector('summary') && e.querySelector('summary').textContent
    }));
    return { count, entries };
  } catch (e) {
    return null;
  }
}

function playSound(url) {
  if (!url) return;
  const audio = new Audio(url);
  audio.play();
}

function showNotification(newCount) {
  chrome.storage.sync.get(['notifySound'], prefs => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'New Emails',
      message: `You have ${newCount} new email(s).`
    });
    playSound(prefs.notifySound);
  });
}

function updateBadge(count, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text: count ? String(count) : '' });
}

async function checkMail() {
  const data = await fetchFeed();
  if (!data) return;
  latestItems = data.entries;
  chrome.storage.local.get('lastCount', store => {
    const prev = store.lastCount || 0;
    if (data.count > prev) {
      showNotification(data.count - prev);
    }
    chrome.storage.local.set({ lastCount: data.count });
  });
  chrome.storage.sync.get({ badgeColor: '#D93025' }, prefs => {
    updateBadge(data.count, prefs.badgeColor);
  });
}

function startChecking() {
  chrome.storage.sync.get({ checkInterval: DEFAULT_INTERVAL }, prefs => {
    if (timer) clearInterval(timer);
    timer = setInterval(checkMail, prefs.checkInterval * 1000);
    checkMail();
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createMenus();
  startChecking();
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.checkInterval || changes.badgeColor) {
    startChecking();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'refresh') {
    checkMail();
  } else if (msg.action === 'latest') {
    sendResponse({ items: latestItems });
  }
});

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'open', title: 'Open Gmail', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'compose', title: 'Compose new message', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'refresh', title: 'Refresh now', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'options', title: 'Open settings', contexts: ['action'] });
  });
}

chrome.contextMenus.onClicked.addListener(info => {
  switch (info.menuItemId) {
    case 'open':
      chrome.tabs.create({ url: 'https://mail.google.com/' });
      break;
    case 'compose':
      chrome.tabs.create({ url: 'https://mail.google.com/mail/?view=cm&fs=1&tf=1' });
      break;
    case 'refresh':
      checkMail();
      break;
    case 'options':
      chrome.runtime.openOptionsPage();
      break;
  }
});
