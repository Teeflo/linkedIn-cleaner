const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const stopBtn = document.getElementById('stop');
const delayInput = document.getElementById('delay');
const delayValue = document.getElementById('delayValue');
const counter = document.getElementById('counter');
const stateSpan = document.getElementById('state');
const progress = document.getElementById('progress');

const postStartBtn = document.getElementById('postStart');
const postPauseBtn = document.getElementById('postPause');
const postStopBtn = document.getElementById('postStop');
const postCounter = document.getElementById('postCounter');
const postStateSpan = document.getElementById('postState');
const postProgress = document.getElementById('postProgress');
const postDelayInput = document.getElementById('postDelay');
const postDelayValue = document.getElementById('postDelayValue');

const sentStartBtn = document.getElementById('sentStart');
const sentPauseBtn = document.getElementById('sentPause');
const sentStopBtn = document.getElementById('sentStop');
const sentCounter = document.getElementById('sentCounter');
const sentStateSpan = document.getElementById('sentState');
const sentProgress = document.getElementById('sentProgress');
const sentDelayInput = document.getElementById('sentDelay');
const sentDelayValue = document.getElementById('sentDelayValue');

const recvAcceptBtn = document.getElementById('recvAccept');
const recvIgnoreBtn = document.getElementById('recvIgnore');
const recvPauseBtn = document.getElementById('recvPause');
const recvStopBtn = document.getElementById('recvStop');
const recvAccepted = document.getElementById('recvAccepted');
const recvIgnored = document.getElementById('recvIgnored');
const recvTotal = document.getElementById('recvTotal');
const recvStateSpan = document.getElementById('recvState');
const recvProgress = document.getElementById('recvProgress');
const recvDelayInput = document.getElementById('recvDelay');
const recvDelayValue = document.getElementById('recvDelayValue');

const modeSelect = document.getElementById('modeSelect');
const resetStateBtn = document.getElementById('resetState');
const sections = {
  connections: document.getElementById('connections'),
  posts: document.getElementById('posts'),
  sent: document.getElementById('sent'),
  received: document.getElementById('received')
};

function showSection(id) {
  Object.values(sections).forEach(sec => {
    if (!id || sec.id !== id) {
      sec.classList.add('hidden');
    } else {
      sec.classList.remove('hidden');
    }
  });
}

chrome.storage.local.get(
  ['selectedMode', 'connectionsState', 'postsState', 'sentInvState', 'receivedInvState'],
  data => {
    const stored = data.selectedMode || '';
    modeSelect.value = stored;
    showSection(stored);

    if (data.connectionsState && typeof data.connectionsState.delay === 'number') {
      delayInput.value = data.connectionsState.delay / 1000;
    }
    if (data.postsState && typeof data.postsState.delay === 'number') {
      postDelayInput.value = data.postsState.delay / 1000;
    }
    if (data.sentInvState && typeof data.sentInvState.delay === 'number') {
      sentDelayInput.value = data.sentInvState.delay / 1000;
    }
    if (data.receivedInvState && typeof data.receivedInvState.delay === 'number') {
      recvDelayInput.value = data.receivedInvState.delay / 1000;
    }

    updateDelayDisplay();
    updatePostDelayDisplay();
    updateSentDelayDisplay();
    updateRecvDelayDisplay();
  }
);

modeSelect.addEventListener('change', () => {
  const value = modeSelect.value;
  chrome.storage.local.set({ selectedMode: value });
  showSection(value);
});

resetStateBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'resetState' });
  chrome.storage.local.remove('selectedMode');
  modeSelect.value = '';
  showSection('');
});

function updateDelayDisplay() {
  delayValue.textContent = `${delayInput.value} sec`;
}

updateDelayDisplay();

delayInput.addEventListener('input', updateDelayDisplay);

function updatePostDelayDisplay() {
  postDelayValue.textContent = `${postDelayInput.value} sec`;
}

updatePostDelayDisplay();
postDelayInput.addEventListener('input', updatePostDelayDisplay);

function updateSentDelayDisplay() {
  sentDelayValue.textContent = `${sentDelayInput.value} sec`;
}

updateSentDelayDisplay();
sentDelayInput.addEventListener('input', updateSentDelayDisplay);

function updateRecvDelayDisplay() {
  recvDelayValue.textContent = `${recvDelayInput.value} sec`;
}

updateRecvDelayDisplay();
recvDelayInput.addEventListener('input', updateRecvDelayDisplay);

startBtn.addEventListener('click', () => {
  const delayMs = parseInt(delayInput.value, 10) * 1000;
  chrome.runtime.sendMessage({ action: 'start', delay: delayMs }, updateState);
});

pauseBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'pause' });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
});

postStartBtn.addEventListener('click', () => {
  const delayMs = parseInt(postDelayInput.value, 10) * 1000;
  chrome.runtime.sendMessage({ action: 'startPosts', delay: delayMs }, updatePostState);
});

postPauseBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'pausePosts' });
});

postStopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopPosts' });
});

sentStartBtn.addEventListener('click', () => {
  const delayMs = parseInt(sentDelayInput.value, 10) * 1000;
  chrome.runtime.sendMessage({ action: 'startSent', delay: delayMs }, updateSentState);
});

sentPauseBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'pauseSent' });
});

sentStopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopSent' });
});

recvAcceptBtn.addEventListener('click', () => {
  const delayMs = parseInt(recvDelayInput.value, 10) * 1000;
  chrome.runtime.sendMessage({ action: 'startReceived', delay: delayMs, mode: 'accept' }, updateRecvState);
});

recvIgnoreBtn.addEventListener('click', () => {
  const delayMs = parseInt(recvDelayInput.value, 10) * 1000;
  chrome.runtime.sendMessage({ action: 'startReceived', delay: delayMs, mode: 'ignore' }, updateRecvState);
});

recvPauseBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'pauseReceived' });
});

recvStopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopReceived' });
});

document.getElementById('close').addEventListener('click', () => window.close());

function translate(status) {
  switch (status) {
    case 'running': return 'Running';
    case 'paused': return 'Paused';
    case 'completed': return 'Completed';
    case 'stopped': return 'Stopped';
    case 'redirecting': return 'Redirecting...';
    case 'loading': return 'Loading...';
    default: return 'Idle';
  }
}

function updatePostState(res) {
  if (!res) return;
  if (res.status) postStateSpan.textContent = translate(res.status);
}

function updateSentState(res) {
  if (!res) return;
  if (res.status) sentStateSpan.textContent = translate(res.status);
}

function updateRecvState(res) {
  if (!res) return;
  if (res.status) recvStateSpan.textContent = translate(res.status);
}

function updateState(res) {
  if (!res) return;
  if (res.status) stateSpan.textContent = translate(res.status);
}

function refreshStatus() {
  chrome.runtime.sendMessage({ action: 'status' }, state => {
    if (state) {
      counter.textContent = `${state.removed}/${state.total}`;
      progress.max = state.total || 0;
      progress.value = state.removed || 0;
      stateSpan.textContent = translate(state.status);
      pauseBtn.textContent = state.status === 'paused' ? 'Resume' : 'Pause';
    }
  });
  chrome.runtime.sendMessage({ action: 'statusPosts' }, pState => {
    if (pState) {
      postCounter.textContent = `${pState.removed}/${pState.total}`;
      postProgress.max = pState.total || 0;
      postProgress.value = pState.removed || 0;
      postStateSpan.textContent = translate(pState.status);
      postPauseBtn.textContent = pState.status === 'paused' ? 'Resume' : 'Pause';
    }
  });
  chrome.runtime.sendMessage({ action: 'statusSent' }, sState => {
    if (sState) {
      sentCounter.textContent = `${sState.removed}/${sState.total}`;
      sentProgress.max = sState.total || 0;
      sentProgress.value = sState.removed || 0;
      sentStateSpan.textContent = translate(sState.status);
      sentPauseBtn.textContent = sState.status === 'paused' ? 'Resume' : 'Pause';
    }
  });
  chrome.runtime.sendMessage({ action: 'statusReceived' }, rState => {
    if (rState) {
      recvAccepted.textContent = rState.accepted || 0;
      recvIgnored.textContent = rState.ignored || 0;
      recvTotal.textContent = rState.total || 0;
      recvProgress.max = rState.total || 0;
      recvProgress.value = (rState.accepted + rState.ignored) || 0;
      recvStateSpan.textContent = translate(rState.status);
      recvPauseBtn.textContent = rState.status === 'paused' ? 'Resume' : 'Pause';
    }
  });
}

setInterval(refreshStatus, 1000);
refreshStatus();
