# 🦩 Flyingo — Next-Gen Social & Messaging Web App

A feature-rich, high-performance modern web messaging and social platform built with Next.js 16, React 19, Tailwind CSS v4, and Framer Motion.

![Flyingo Preview](/public/flyingo-logo.png)

## ✨ Features

- **💬 Real-Time Direct & Group Messaging**: Cross-tab synchronized messaging, typing indicators, audio/video call simulation, reply threading, message reactions, voice notes, GIF integration, and file attachments.
- **🚨 Instant Panic Mode**: Centered panic trigger with customizable decoy personas, fake conversation threads, and instant data concealment.
- **🎵 Interactive Notes**: Share text, custom audio clips, and music snippets with custom expiration duration and persistent audio storage via IndexedDB.
- **🦩 Flamingoos (Stories)**: Instagram-style interactive stories with customizable background atmospheric shaders, draggable text formatting (fonts, bold, italic, underline, pill highlight), media uploads, and story progression viewer.
- **🟢 Live Dynamic Presence**: Heartbeat-based online/offline indicator for active connections with dynamic status tags.
- **🛡️ Locked Admin Security Panel**: Sensitive configuration dashboard with strict credential validation and instant auto-lock on blur or tab-switch.
- **🎨 Custom Chat Themes & Wallpapers**: Personalized sent/received bubble themes, opacity adjustment, and atmospheric chat backgrounds.
- **📱 Fully Responsive Mobile-First Design**: Native feel with swipe gestures, bottom navigation, adaptive modals, and touch-optimized controls.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (Turbopack)](https://nextjs.org/)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Storage**: IndexedDB (Audio blobs) & LocalStorage (State synchronization)
- **Icons & Badges**: Material Symbols & Custom Verified Badges

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 🌐 Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/new).
3. Import the `Flyingo` repository.
4. Leave build settings as default (`next build`).
5. Click **Deploy**.

