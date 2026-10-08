# AuraGram 🌌

A modern, high-performance aesthetic social micro-blogging and reels platform built with a sleek Instagram/Threads-inspired dark UI. Features seamless video feeds, real-time engagement, double-tap interactions, active screen tracking, and user personalization.

---

## ✨ Features

- **Aesthetic Dark Theme UI**: Minimalist, responsive design built for media viewing.
- **Seamless Video Reels**: Local video hosting with auto-pause/mute transitions via the `IntersectionObserver` API on scroll.
- **Curated Non-Repeating Feed**: Structured media distribution with unique photography assets and distinct video streams.
- **Interactive Engagement**:
  - Double-tap to heart animation ❤️
  - Instant like/unlike counter sync
  - Real-time thread comments
  - Add to Story & copy link sharing
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing.
- **Author Profiles**: Profile modal inspection to view creator bios and gallery grids.
- **Customizable Experience**: Slide-out settings drawer to switch themes (Pitch Black, Midnight Blue, Velvet Purple) and accent colors.
- **Live Screen Timer**: Real-time session time tracker directly in the navigation bar.
- **Help & Support**: Integrated bug/issue ticketing interface with developer contact routing (`hk3741883@gmail.com`).

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Variables, Flexbox, CSS Grid)
- **Backend**: Node.js, Express.js
- **Authentication**: JSON Web Tokens (JWT), bcryptjs
- **Data Persistence**: JSON-based file storage (`database.json`)
- **Media Engine**: Native HTML5 Video API with `IntersectionObserver`

---

## 📁 Project Structure

```text
auragram/
├── public/
│   ├── videos/              # Locally stored reels (reel1.mp4, reel2.mp4, etc.)
│   ├── index.html           # Main SPA interface
│   ├── style.css            # Dark aesthetic styling and themes
│   └── app.js               # Feed rendering, observer logic, and client auth
├── .gitignore               # Files excluded from git tracking
├── database.json            # Auto-generated database storage (ignored in git)
├── package.json             # Project dependencies and metadata
├── server.js                # Express API server and initial data seeder
└── README.md                # Project documentation