document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);
document.getElementById('interval').addEventListener('input', e => {
  document.getElementById('intervalValue').textContent = e.target.value;
});
document.getElementById('customSound').addEventListener('change', handleSound);

function restore() {
  chrome.storage.sync.get({checkInterval:60, badgeColor:'#D93025', notifySound:''}, prefs => {
    document.getElementById('interval').value = prefs.checkInterval;
    document.getElementById('intervalValue').textContent = prefs.checkInterval;
    document.getElementById('badgeColor').value = prefs.badgeColor;
    document.getElementById('sound').value = prefs.notifySound;
  });
}

function handleSound(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) {
    alert('File too large');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('sound').value = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function save() {
  const interval = parseInt(document.getElementById('interval').value, 10);
  const badgeColor = document.getElementById('badgeColor').value;
  const sound = document.getElementById('sound').value;
  chrome.storage.sync.set({checkInterval: interval, badgeColor, notifySound: sound});
}
