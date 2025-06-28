document.getElementById('open').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://mail.google.com/' });
});

document.getElementById('refresh').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'refresh' });
});

chrome.runtime.sendMessage({ action: 'latest' }, data => {
  const emailsDiv = document.getElementById('emails');
  if (!data || !data.items || data.items.length === 0) {
    emailsDiv.textContent = 'No recent emails.';
    return;
  }
  data.items.slice(0, 3).forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.author}: ${item.title}`;
    emailsDiv.appendChild(div);
  });
});
