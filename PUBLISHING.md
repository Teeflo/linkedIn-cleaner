# Publishing Your Chrome Extension

## 1. Extension Information

**Name:** LinkedIn Cleaner - Network Manager  
**Short Name:** LinkedIn Cleaner  
**Summary:** Effortlessly clean your LinkedIn connections, withdraw sent requests, and delete old posts to maintain a professional profile.  

## 2. Detailed Description

**Take back control of your professional network.**

LinkedIn Cleaner is the ultimate tool for managing your LinkedIn profile efficiently. Whether you want to declutter your connections, withdraw old pending invitations, or remove outdated posts, this extension automates the process safely and effectively.

**Key Features:**

*   **Bulk Connection Removal:** Remove hundreds of connections in minutes with customizable delays to keep your account safe.
*   **Withdraw Sent Invitations:** Automatically withdraw pending connection requests that have been ignored for too long.
*   **Delete Old Posts:** Wipe your activity history by bulk deleting your posts.
*   **Manage Received Invitations:** Auto-accept or auto-ignore incoming connection requests.
*   **Smart Safety Delays:** Built-in random delays to simulate human behavior and protect your account.
*   **Real-time Progress:** Visual progress bars and counters to track every action.

**Privacy Policy:**
This extension runs entirely locally on your browser. No data is sent to external servers. Your LinkedIn credentials are never accessed directly or stored.

## 3. Visual Assets (Required for Store)

You will need to upload the following assets to the Chrome Web Store dashboard.

### A. Icons
(Already in your `icons/` folder)
- 16x16 px (`icon16.png`)
- 32x32 px (`icon32.png`)
- 48x48 px (`icon48.png`)
- 128x128 px (`icon128.png`)

### B. Screenshots (1280x800 px)
*Capture these from the extension popup:*
1.  **Main Menu:** Show the clean, modern interface with the mode selection dropdown.
2.  **Connections Mode:** Show the "Remove Connections" screen with the progress bar active.
3.  **Sent Invites Mode:** Display the "Withdraw Sent Invites" screen.

### C. Promotional Images
1.  **Small Tile (440x280 px):** A clean graphic with the LinkedIn Cleaner logo and a catchy tagline like "Clean Your Network".
2.  **Marquee (1400x560 px):** A wider version of the promotional graphic, perhaps showing a stylized version of the interface.

## 4. Setting Up the Web Store Listing

1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  Click **"New Item"**.
3.  Upload the ZIP file of your extension (compress the directory containing `manifest.json`).
4.  Fill in the **Store Listing** details using the text above.
5.  Upload the **Icons** and **Screenshots**.
6.  Select **Category**: "Productivity" or "Social & Communication".
7.  **Privacy Practices**:
    - **Host Permissions**: Explain that the extension needs access to `linkedin.com` to perform actions on your behalf (clicking buttons, navigating pages).
    - **Remote Code**: State that no remote code is used.
8.  Submit for Review!

## 5. Tips for Approval
- **Permissions**: We only use strictly necessary permissions (`activeTab`, `scripting`, `tabs`, `storage`).
- **Description**: Ensure the description clearly states *what* the extension does to avoid "Spam/Misleading" rejection.
