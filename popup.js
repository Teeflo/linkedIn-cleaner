const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const stopBtn  = document.getElementById('stop');
const delaySel = document.getElementById('delay');
const statusEl = document.getElementById('status');
const counterEl = document.getElementById('counter');
const progressBar = document.getElementById('progress-bar');
let isPaused = false;

function updateButtons(running) {
  startBtn.disabled = running;
  pauseBtn.disabled = !running;
  stopBtn.disabled = !running;
}

function updateStatus(text) {
  statusEl.textContent = 'Statut : ' + text;
}

function sendAction(action) {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if(tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, action);
    }
  });
}

startBtn.addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    const tab = tabs[0];
    const url = 'https://www.linkedin.com/mynetwork/invite-connect/connections/';
    if(!tab.url.includes('/mynetwork/invite-connect/connections/')) {
      updateStatus('Redirection...');
      chrome.tabs.update(tab.id, {url}, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if(tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            sendAction({action:'start', delay: Number(delaySel.value)});
          }
        });
      });
    } else {
      sendAction({action:'start', delay: Number(delaySel.value)});
    }
    updateStatus('En cours');
    updateButtons(true);
    isPaused = false;
    pauseBtn.textContent = 'Pause';
  });
});

pauseBtn.addEventListener('click', () => {
  if(isPaused) {
    sendAction({action:'resume'});
    pauseBtn.textContent = 'Pause';
    updateStatus('En cours');
    isPaused = false;
  } else {
    sendAction({action:'pause'});
    pauseBtn.textContent = 'Reprendre';
    updateStatus('En pause');
    isPaused = true;
  }
});

stopBtn.addEventListener('click', () => {
  sendAction({action:'stop'});
  updateButtons(false);
  updateStatus('Terminé');
});

document.getElementById('close').addEventListener('click', () => window.close());

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg.type === 'progress') {
    const percent = msg.total ? (msg.removed / msg.total) * 100 : 0;
    progressBar.style.width = percent + '%';
    counterEl.textContent = msg.removed + ' supprimées';
  } else if(msg.type === 'status') {
    updateStatus(msg.status === 'running' ? 'En cours' :
                 msg.status === 'paused' ? 'En pause' :
                 msg.status === 'finished' ? 'Terminé' : 'Arrêté');
    if(msg.status === 'finished' || msg.status === 'stopped') {
      updateButtons(false);
    }
  }
});
