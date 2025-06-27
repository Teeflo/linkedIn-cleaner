// Content script for LinkedIn Cleaner
(function() {
  const state = {
    running: false,
    paused: false,
    stop: false,
    removed: 0,
    total: 0,
    delay: 1500
  };

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function cleanLoop() {
    while(state.running && !state.stop) {
      if(state.paused) {
        await wait(300);
        continue;
      }
      const card = document.querySelector('li.mn-connection-card');
      if(!card) {
        chrome.runtime.sendMessage({type:'status', status:'finished', removed: state.removed, total: state.total});
        state.running = false;
        return;
      }
      const moreBtn = card.querySelector("button[aria-label*='More actions'], button[aria-label*='Plus d\u2019actions'], button[aria-label*='Plus d\\'action']");
      if(moreBtn) {
        moreBtn.click();
        await wait(500);
        const removeBtn = document.querySelector("div[role='menu'] button[aria-label*='Remove connection'], div[role='menu'] button[aria-label*='Retirer la relation'], div[role='menu'] button[aria-label*='Supprimer la relation']");
        if(removeBtn) {
          removeBtn.click();
          await wait(500);
          const confirmBtn = document.querySelector("button.artdeco-button--danger, button[aria-label*='Remove'], button[aria-label*='Retirer'], button[aria-label*='Supprimer']");
          if(confirmBtn) confirmBtn.click();
        }
      }
      state.removed += 1;
      chrome.runtime.sendMessage({type:'progress', removed: state.removed, total: state.total});
      await wait(state.delay);
    }
    if(state.stop) {
      chrome.runtime.sendMessage({type:'status', status:'stopped', removed: state.removed, total: state.total});
      state.running = false;
    }
  }

  function start(delay) {
    if(state.running) return;
    state.delay = delay;
    state.running = true;
    state.paused = false;
    state.stop = false;
    state.removed = 0;
    state.total = document.querySelectorAll('li.mn-connection-card').length;
    chrome.runtime.sendMessage({type:'status', status:'running', removed: state.removed, total: state.total});
    cleanLoop();
  }
  function pause() {
    if(!state.running) return;
    state.paused = true;
    chrome.runtime.sendMessage({type:'status', status:'paused', removed: state.removed, total: state.total});
  }
  function resume() {
    if(!state.running) return;
    state.paused = false;
    chrome.runtime.sendMessage({type:'status', status:'running', removed: state.removed, total: state.total});
  }
  function stop() {
    if(!state.running) return;
    state.stop = true;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(msg.action === 'start') {
      start(msg.delay);
    } else if(msg.action === 'pause') {
      pause();
    } else if(msg.action === 'resume') {
      resume();
    } else if(msg.action === 'stop') {
      stop();
    }
  });
})();
