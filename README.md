# Gmail Notifier

*Receive desktop notifications for new Gmail messages.*

This extension checks your Gmail inbox at regular intervals and alerts you when new emails arrive. Customize the badge color, notification sound and check interval.

## Installation
1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** and click **Load unpacked**, then select this folder.

## Options
- **Check interval**: how often to poll Gmail.
- **Badge color**: customize the toolbar badge.
- **Notification sound**: choose among predefined sounds or upload your own (max 500KB).

## Permissions
The extension requires access to `https://mail.google.com/*` to fetch your unread count and uses the Notifications and Storage APIs.
