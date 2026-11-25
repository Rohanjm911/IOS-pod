<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=BitChord%20iOS&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=32&desc=Unlimited%20Playlist%20Import%20%E2%80%A2%20Multi-Source%20Matching%20%E2%80%A2%20Seamless%20Playback&descAlignY=52&descSize=16&descColor=ccc"/>

[![GitHub Stars](https://img.shields.io/github/stars/Rohanjm911/bitchord-IOS?style=for-the-badge&logo=github&color=gold)](https://github.com/Rohanjm911/bitchord-IOS/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

</div>

---

## ✨ What is BitChord?

**BitChord iOS** is a modern, open‑source music player web app that lets you **import playlists from any major streaming service** and play them seamlessly — no subscriptions required.

> Import from Spotify, YouTube Music, Deezer, and iTunes → Match tracks across multiple sources → Play with a beautiful iOS‑inspired UI.

---

## 🚀 Features

<table>
<tr>
<td width="50%">

### 🎵 Unlimited Playlist Import
Import playlists with **no track limits** from:
- 🔴 YouTube Music (continuation tokens)
- 🟢 Spotify (Pathfinder API + pagination)
- 🟣 Deezer (public API)
- 🍎 iTunes / Apple Music

</td>
<td width="50%">

### 🎯 Strict Multi-Source Matching
Finds the **best quality match** for every track:
- YouTube Music catalog (primary)
- iTunes metadata lookup
- YouTube video search (fallback)
- Rejects mismatched / low-quality uploads

</td>
</tr>
<tr>
<td width="50%">

### 🔒 Proxy Support
Built-in secure API proxy for cross-origin requests:
- Deezer, Spotify & Apple Music CORS bypass
- iOS Cloudflare Worker proxy
- Custom headers & origin spoofing

</td>
<td width="50%">

### 🎨 Beautiful UI
- 🌙 Dark / Light mode
- 📀 Album art in player
- 🎤 Synced lyrics (LRC/TTML)
- 📚 Personal library management

</td>
</tr>
</table>

---

## 🛠️ Installation

```bash
# 1. Clone the repo
git clone https://github.com/Rohanjm911/bitchord-IOS.git
cd bitchord-IOS/web/app

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
# → http://localhost:5173

# 4. Build for production
pnpm build
```

### ⚙️ Proxy Configuration

```bash
# Start the local proxy (required for Spotify/Deezer imports)
npx pnpm@latest --dir web/app exec vite preview --port 5173 --host
```

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PROXY_URL` | `http://localhost:5173/api/proxy` | Proxy server URL |
| `PROXY_SECRET` | _(none)_ | Secret key for authenticated requests |

---

## 📖 Usage

### Importing a Playlist

1. Open the app → click **Library** → **Import Playlist**
2. Paste a playlist URL:
   - `https://open.spotify.com/playlist/...`
   - `https://music.youtube.com/playlist?list=...`
   - `https://www.deezer.com/playlist/...`
3. BitChord fetches **all tracks** (no limit!) and matches each one across multiple sources
4. Your playlist appears in **Library** — ready to play 🎶

### Track Matching Flow

```
Playlist URL
     │
     ▼
Fetch all tracks (unlimited pagination)
     │
     ├─► YouTube Music catalog search
     │        └─► Strict match? ✅ → Use it
     │
     ├─► iTunes metadata search
     │        └─► Strict match? ✅ → Use it
     │
     └─► YouTube video fallback search
              └─► Best match → Use it
```

---

## 🧪 Development

```bash
# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Preview production build
pnpm preview
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. 🍴 Fork the repo
2. 🌿 Create a feature branch: `git checkout -b feature/my-feature`
3. ✅ Run tests: `pnpm test`
4. 📬 Submit a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer&animation=twinkling"/>

Made with ❤️ by [Rohanjm911](https://github.com/Rohanjm911)

</div>
