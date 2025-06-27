const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const stopBtn = document.getElementById('stop');
const delayInput = document.getElementById('delay');
const delayValue = document.getElementById('delayValue');
const counter = document.getElementById('counter');
const stateSpan = document.getElementById('state');
const progress = document.getElementById('progress');

function updateDelayDisplay() {
  delayValue.textContent = `${delayInput.value} sec`;
}

updateDelayDisplay();

delayInput.addEventListener('input', updateDelayDisplay);

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

function updateState(res) {
  if (!res) return;
  if (res.status) stateSpan.textContent = translate(res.status);
}

function refreshStatus() {
  chrome.runtime.sendMessage({ action: 'status' }, state => {
    if (!state) return;
    counter.textContent = `${state.removed}/${state.total}`;
    progress.max = state.total || 0;
    progress.value = state.removed || 0;
    stateSpan.textContent = translate(state.status);
    pauseBtn.textContent = state.status === 'paused' ? 'Resume' : 'Pause';
  });
}

setInterval(refreshStatus, 1000);
refreshStatus();
