# LinkedIn Cleaner

*Take back control of your professional network with a single click.*

LinkedIn Cleaner is a minimalist Chrome extension that helps you manage and clean your list of LinkedIn connections. It automatically removes connections displayed on the page while simulating human behavior with random pauses.

## Installation
1. Clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode and choose **Load unpacked** and select this folder.

## Usage
1. Navigate to your LinkedIn connections page: `https://www.linkedin.com/mynetwork/invite-connect/connections/`.
2. Click the extension icon then **Start** to begin automatic removal.
3. Use **Pause** or **Stop** to control the process. Visible contacts will be removed one by one. Reload the page to process another batch if necessary.

## Who is this extension for?
- Professionals in career transition who want to refocus their network.
- Active users whose connection list has become unmanageable.
- Marketing and sales experts looking to refine their audience.
- Anyone who values quality over quantity.

## How it works
The extension checks that you're on the connections page before running the script. It opens each contact's actions menu, clicks **Remove connection**, confirms the deletion and waits 1.5 to 2 seconds between contacts to mimic a human pace. The injection logic is now handled by a *service worker* for greater reliability, and the process automatically stops when you leave the connections page.
