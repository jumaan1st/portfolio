# Release Notes - v1.1.0

This release introduces major admin panel improvements—most notably the standalone GitHub README sync dashboard and Outreach Hub—along with critical security/bug fixes for outreach email pixel tracking.

---

## 🚀 Key Features

### 1. Standalone GitHub README Sync Panel (`/admin/github`)
We transitioned the GitHub preview panel from a tab inside the `/admin` view into a full-screen standalone page:
- **Interactive Chrome browser mockup**: Visual tab-bar and URL bar to simulate actual rendering.
- **Dynamic tabbed view**: Easily switch between checking raw SVG assets and viewing the compiled README profile.
- **Theme-responsive preview styles**: Adjusted markdown compiler typography dynamically. Titles (e.g., *About Me*, *Tech Stack & Skills*), links, blockquotes, and code tags now render in high contrast in both **light** and **dark** modes.
- **R2 SVGs compiler**: Generates responsive SVGs for your profile header, skills badges, and certificates, uploads them to your bucket, and compiles the final `README.md`.

### 2. Standalone System Reports (`/admin/reports`)
Provides administrative analytics and logs:
- **Reviews & Feedback**: Manage reviews and testimonials.
- **AI & Outreach Usage Logs**: Log tracker for AI usage and assistant activities.

---

## 🔧 Bug Fixes & Improvements

### 1. Email Open Tracking Pixel Fix
- Fixed a crash issue caused by unresolved `crypto` API bindings.
- Improved header parsing to handle comma-split proxies/IPs safely and truncate results to 45 characters.
- Added transactional error-handling for outreach session logging.

### 2. Certifications Revert
- Reverted dynamic image uploads for certificates to keep layout clean and lightweight.
- Dropped `image_url` from `portfolio.certifications` table and reverted the fields back to standard Devicons font classes.

### 3. Sidebar Navigation Panel Fix
- Re-styled the sidebar to prevent cut-off on "System Reports" and other bottom links.
- Re-wired "GitHub Sync" to point directly to `/admin/github` with a purple GitHub brand icon and an external link badge.
