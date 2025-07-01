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

document.getElementById('close').addEventListener('click', () => window.close());

function translate(status) {
  switch (status) {
    case 'running': return 'Running';
    case 'paused': return 'Paused';
    case 'completed': return 'Completed';
    case 'stopped': return 'Stopped';
    case 'redirecting': return 'Redirecting...';
    default: return 'Idle';
  }
}

function updatePostState(res) {
  if (!res) return;
  if (res.status) postStateSpan.textContent = translate(res.status);
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
}

setInterval(refreshStatus, 1000);
refreshStatus();
