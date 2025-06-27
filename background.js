chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'clean') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      if (!tab || !tab.url || !tab.url.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: function() { alert('Veuillez naviguer vers votre page de connexions LinkedIn.'); }
        }, function() {
          sendResponse();
        });
        return true; // Keep the message channel open for async response
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function() {
          function wait(ms) {
            return new Promise(function(resolve) { setTimeout(resolve, ms); });
          }
          function randomDelay() { return 1500 + Math.random() * 500; }
          if (!location.href.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
            alert('Veuillez naviguer vers votre page de connexions LinkedIn.');
            return;
          }
          var cards = Array.prototype.slice.call(document.querySelectorAll('li.mn-connection-card'));

          function processCard(i) {
            if (i >= cards.length) {
              return;
            }
            var card = cards[i];
            var moreBtn = card.querySelector(
              "button[aria-label*='More actions'], button[aria-label*='Plus d\\u2019actions'], button[aria-label*=\"Plus d'action\"]"
            );
            function continueNext() {
              wait(randomDelay()).then(function() { processCard(i + 1); });
            }
            if (moreBtn) {
              console.log('Opening actions menu for', card);
              moreBtn.click();
              wait(500).then(function() {
                var removeBtn = document.querySelector(
                  "div[role='menu'] button[aria-label*='Remove connection'], div[role='menu'] button[aria-label*='Retirer la relation'], div[role='menu'] button[aria-label*='Supprimer la relation']"
                );
                if (removeBtn) {
                  console.log('Removing connection');
                  removeBtn.click();
                  wait(500).then(function() {
                    var confirmBtn = document.querySelector(
                      "button.artdeco-button--danger, button[aria-label*='Remove'], button[aria-label*='Retirer'], button[aria-label*='Supprimer']"
                    );
                    if (confirmBtn) {
                      console.log('Confirming removal');
                      confirmBtn.click();
                    }
                    continueNext();
                  });
                } else {
                  continueNext();
                }
              });
            } else {
              continueNext();
            }
          }

          processCard(0);
        }
      }, function() {
        sendResponse();
      });
      return true; // Keep the message channel open for async response
    });
    return true;
  }
});