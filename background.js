 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/background.js b/background.js
index 5b309ba911ba8c7b6b40ab909817fd3f69113efe..a1cafb7cc37d0611a116fce9b66501c083e3822e 100644
--- a/background.js
+++ b/background.js
@@ -1,45 +1,52 @@
 function removeConnections() {
   function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
   function randomDelay() { return 1500 + Math.random() * 500; }
   if (!location.href.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
     alert('Veuillez naviguer vers votre page de connexions LinkedIn.');
     return;
   }
   const cards = Array.from(document.querySelectorAll('li.mn-connection-card'));
   (async () => {
     for (const card of cards) {
-      const moreBtn = card.querySelector('button[aria-label*="More actions"], button[aria-label*="Plus d\u2019actions"]');
+      const moreBtn = card.querySelector(
+        "button[aria-label*='More actions'], button[aria-label*='Plus d\\u2019actions'], button[aria-label*='Plus d\\'actions']"
+      );
       if (moreBtn) {
+        console.log("Opening actions menu for", card);
         moreBtn.click();
         await wait(500);
-        const removeBtn = document.querySelector('div[role="menu"] button[aria-label*="Remove connection"], div[role="menu"] button[aria-label*="Retirer la relation"]');
+        const removeBtn = document.querySelector('div[role="menu"] button[aria-label*="Remove connection"], div[role="menu"] button[aria-label*="Retirer la relation"], div[role="menu"] button[aria-label*="Supprimer la relation"]');
         if (removeBtn) {
+          console.log("Removing connection");
           removeBtn.click();
           await wait(500);
-          const confirmBtn = document.querySelector('button.artdeco-button--danger, button[aria-label*="Remove"], button[aria-label*="Retirer"]');
-          if (confirmBtn) confirmBtn.click();
+          const confirmBtn = document.querySelector('button.artdeco-button--danger, button[aria-label*="Remove"], button[aria-label*="Retirer"], button[aria-label*="Supprimer"]');
+          if (confirmBtn) {
+            console.log('Confirming removal');
+            confirmBtn.click();
+          }
         }
       }
       await wait(randomDelay());
     }
   })();
 }
 
 chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.action === 'clean') {
     chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
       if (!tab?.url.includes('linkedin.com/mynetwork/invite-connect/connections/')) {
         chrome.scripting.executeScript({
           target: { tabId: tab.id },
           func: () => alert('Veuillez naviguer vers votre page de connexions LinkedIn.')
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
 
EOF
)
