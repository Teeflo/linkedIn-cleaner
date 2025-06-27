function removeConnections() {
  function wait(ms) {
    return new Promise(function(r) {
      setTimeout(r, ms);
    });
  }
  function randomDelay() { return 1500 + Math.random() * 500; }
  if (!location.href.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
    alert('Veuillez naviguer vers votre page de connexions LinkedIn.');
    return;
  }
  var cards = Array.from(document.querySelectorAll('li.mn-connection-card'));
  (async function() {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var moreBtn = card.querySelector(
        "button[aria-label*='More actions'], button[aria-label*='Plus d\\u2019actions'], button[aria-label*=\"Plus d'action\"]"
      );
      if (moreBtn) {
        console.log('Opening actions menu for', card);
        moreBtn.click();
        await wait(500);
        var removeBtn = document.querySelector(
          "div[role='menu'] button[aria-label*='Remove connection'], div[role='menu'] button[aria-label*='Retirer la relation'], div[role='menu'] button[aria-label*='Supprimer la relation']"
        );
        if (removeBtn) {
          console.log('Removing connection');
          removeBtn.click();
          await wait(500);
          var confirmBtn = document.querySelector(
            "button.artdeco-button--danger, button[aria-label*='Remove'], button[aria-label*='Retirer'], button[aria-label*='Supprimer']"
          );
          if (confirmBtn) {
            console.log('Confirming removal');
            confirmBtn.click();
          }
        }
      }
      await wait(randomDelay());
    }
  })();
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'clean') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      if (!tab || !tab.url || !tab.url.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: function() { alert('Veuillez naviguer vers votre page de connexions LinkedIn.'); }
        });
        sendResponse();
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: removeConnections
      });
      sendResponse();
    });
    return true;
  }
});