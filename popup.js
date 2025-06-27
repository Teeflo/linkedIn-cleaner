document.getElementById('clean').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'clean' });
});
