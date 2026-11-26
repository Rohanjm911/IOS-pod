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

## 🚀 Features & Implementation Timeline

### 🆕 Newly Implemented Features

| Feature | Implementation Date & Time | Description |
|---|---|---|
| 🎨💿 **Mochy-Style Full-Screen Player Customizer** | Nov 27, 2026 • 01:45 IST | Added a live inline Full-Screen Customizer (`FullScreenPlayer.tsx` + `ui.ts`) accessible via the top **Customize** pill or bottom **Sparkles** icon: switch Artwork Styles (**Classic**, spinning **Vinyl** disc with center spindle, **Soft** squircle, **Minimal**), Backdrops (**Mesh**, **Aurora**, **Frosted**, **AMOLED**), Stage Layouts (**Apple Split**, **Mochy Flip**, **Glass Card**), and Audio Visualizer visibility with instant persistence. |
| 🎛️✨ **Customizable Player Bar Styles** | Nov 27, 2026 • 01:14 IST | Added 4 live-switchable Player Bar visual styles (`Apple Glass`, `Compact Pill`, `Studio Dock`, and `Neon Glow`) persisted in `ui.ts` (`bitchord:player-style`), selectable from both the quick Theme Customizer modal (`ThemeModal.tsx`) and `SettingsPage.tsx`, and applied dynamically across desktop `PlayerBar.tsx` and `MobilePlayerBar.tsx`. |
| 🛡️▶️ **Resilient Multi-Tier Playback & Embed Fallback Fix** | Nov 27, 2026 • 00:00 IST | Fixed intermittent playback failures when tracks hit YouTube embed restrictions (`Error 101/150`) or bot-gates: filtered out non-YouTube IDs (`audius:` / `itunes:`) from YouTube IFrame `tryEmbed`, parallelized `searchSongs` + `searchMainVideos("${query} audio")` up to 6 embeddable fallback candidates, added Audius full-MP3 stream fallback in `YouTubeEngine.load()` catch recovery, and enabled automatic radio advance when a single unplayable track fails. |
| 🌐🎵 **Multi-Source Built-In Song Fetching & Streaming (Audius + iTunes)** | Nov 26, 2026 • 23:39 IST | Added built-in non-YouTube music fetching and playback (`externalSources.ts`): integrates **Audius Discovery Network** (direct 320kbps MP3 full-track streaming, CORS-enabled, zero bot-gate, full 10-band EQ & visualizer support) and **Apple iTunes Search API** into `fetchSearch`, `searchSongs`, `genreRadio.ts`, and `YouTubeEngine.load()` automatic fallback—so songs search, load, and play even without YouTube or browser extensions. |
| 🌟🚀 **Netflix-Style Multi-Color Startup Splash Screen & Sound** | Nov 26, 2026 • 23:52 IST | Upgraded `StartupScreen.tsx` with a cinematic pitch-black stage, 10 Netflix-inspired multi-color vertical spectrum light ribbons (`netflix-ribbon`), conic-gradient ambient glow, spring-scaled glass `LogoMark` badge with light-sheen sweep, multi-color gradient `"BitChord"` wordmark with `netflix-zoom` transition, 5-bar neon equalizer, synthesized Web Audio `"Ta-Dum"` sub-bass + harmonic chord startup sound effect (isolated strictly to startup), tap-to-skip, and `prefers-reduced-motion` support. |
| ⏩🎬 **Auto-Detect & Skip Intros & End Credits** | Nov 26, 2026 • 23:26 IST | Multi-tier automatic intro, non-music skit, and end-credits skipper: Tier 1 queries SponsorBlock (`music_offtopic`, `intro`, `outro`) with segment merging and caching; Tier 2 analyzes synced lyrics vocal boundaries (`>= 20s` opening delay and `>= 18s` trailing credits); Tier 3 monitors real-time Web Audio `AnalyserNode` silence tails (`>= 4s`) to automatically advance to the next track; plus user toggle in Settings and manual-seek re-watch protection. |
| ⏭️⏮️ **Next & Previous Transport Buttons Fix** | Nov 26, 2026 • 20:05 IST | Resolved non-functional Next and Previous track controls across PlayerBar, FullScreenPlayer, MiniPlayer, and MobilePlayerBar: eliminated artificial `!hasNext` button disabling so transport is always active; wired hardware `unlockAudioOnGesture()` to both buttons to prevent browser audio context drops; enhanced `previous()` with double-tap (<2s) and beginning-of-track detection to instantly jump to previous tracks instead of perpetually seeking to 0; and strengthened `advance()` with auto-looping, same-genre radio refill, and automatic skipping of unplayable tracks. |
| 📻🎶 **Intelligent Same-Genre Auto-Loading Radio Engine** | Nov 26, 2026 • 19:55 IST | Automatically detects the musical genre and acoustic vibe of any currently playing song (via iTunes Search API with fallback heuristic taxonomy across Bollywood, Punjabi, Dance/EDM, Rock, Pop, Hip-Hop, Lo-Fi, etc.), auto-loads a continuous Up Next queue of same-genre tracks with multi-tier fallback (YouTube Music Radio -> YTM Songs shelf -> YouTube Video Search), dynamically refills the queue when low (<= 2 tracks), and eliminates stalled or abrupt playback endings. |
| 🔊🔇 **Volume Slider & Mute Toggle Bridge Fix** | Nov 26, 2026 • 19:40 IST | Fixed master volume slider and mute speaker button by keeping `deck.audio.volume` and `deck.audio.muted` synchronized across both IframePlayerAdapter (YouTube Iframe embed bridge) and native HTMLMediaElement outputs alongside Web Audio `eqMasterGain`, added continuous real-time `onInput` dragging, added `stopPropagation` on mute button taps, and auto-restored 50% volume when unmuting from 0%. |
| ⚡🔊 **Studio Equalizer Live DSP Routing Engine Fix** | Nov 26, 2026 • 19:35 IST | Decoupled 10-Band Equalizer from the heavy Automix DJ scheduler into a dedicated Web Audio DSP pipeline; attached deck HTMLAudioElements directly via cached MediaElementAudioSourceNodes; wired hardware gesture AudioContext automatic resume across all gestures, slider adjustments, and preset clicks; routed master and deck fader volumes cleanly through eqMasterGain; and restored live real-time audible acoustic processing with visual pulsing DSP indicators. |
| 🎚️ **10-Band Studio Sound Equalizer with Custom Preset Import/Export** | Nov 26, 2026 • 19:05 IST | Upgraded from 5 to 10 ISO octave frequency bands (32 Hz to 16 kHz), added 14 popular studio genre presets (Bass Boost, Bass Reducer, Vocal Booster, Treble Booster, EDM, Rock, Hip-Hop, Pop, Acoustic, Classical, Jazz, Deep Lounge, Dialogue), wired real-time Web Audio biquad filter chain directly into playback, and added full custom preset management with JSON import/export and 5-to-10 band interpolation. |
| ✨ **Apple-Grade Micro-Animations & Motion Polish** | Nov 26, 2026 • 18:55 IST | Hardware-accelerated dynamic artwork radiosity breathing bloom (`4.5s` pulse during playback), spring modal popups (`cubic-bezier(0.16, 1, 0.3, 1)`), tactile spring physics on transport controls (`hover:scale-108 active:scale-92`), and accent-color reactive audio visualizer with illuminated white tips. |
| ⚡ **Lyrics Animation Polish & Zero-Delay Sync Engine** | Nov 26, 2026 • 18:51 IST | Removed awkward line bobbing/wobble and character jitter; introduced rock-solid Apple Music typography, clean opacity hierarchy (no greasy blur), and crystal-clear ambient radiosity glow. Accelerated clock slew rate (`CORRECTION_MS = 150`, `MAX_SLEW = 0.75`), added +220ms lead-in compensation to eliminate hardware audio buffer delay, and integrated custom sync offset slider (-200ms to +600ms) in Lyric Settings. |
| 🎛️ **PlayerBar & Landscape Responsive Layout** | Nov 26, 2026 • 18:45 IST | Glass-pill dynamic responsive expansion (up to 840px), intelligent Quick Tools contextual popover (`SlidersHorizontal`), auto-collapsing utility buttons when side panels open, preventing UI truncation and LCD title squashing across all screen sizes. |
| 🎤 **Fluid Apple Music Lyric Animations** | Nov 26, 2026 • 18:37 IST | Spring-driven active line entrance elevation (`scale(1.045)`), dynamic breathing radiosity karaoke glow with key-color ambient bloom, 3D progressive depth-of-field blur on inactive lines, syllable karaoke pop, tactile seek hover highlights, and dancing instrumental gap dots. |
| 📱 **Landscape Mode Formatting Overhaul** | Nov 26, 2026 • 18:32 IST | Redesigned FullScreenPlayer layout for landscape and compact heights (≤620px): side-by-side artwork + metadata header row, isolated z-20 bottom action bar eliminating control collisions, compact scrubber, 38px transport, and auto-scaled 22px visualizer. |
| 🖤 **Pure AMOLED Pitch Black Mode** | Nov 26, 2026 • 18:24 IST | True `#000000` pitch-black dark theme for zero-power display efficiency on OLED/AMOLED screens, deep contrast, and true-black shelves and sidebars. |
| 🎨 **Custom Accent Colors & iOS Palettes** | Nov 26, 2026 • 18:24 IST | Live HTML5 color picker and hex input for custom button/accent tinting, 10 quick vibrant color swatches, plus 9 curated iOS palettes (Neon Pink, Electric Blue, Sunset Coral, Mint, Violet, Amber, Emerald, Cyan, Crimson). |
| 🪟 **Glassmorphism Customizer** | Nov 26, 2026 • 18:24 IST | 4-tier background blur and translucency customization: Apple Glass (32px), Ultra Frosted (48px high saturation), Subtle Glass (12px), and Solid Flat (0px blur for high performance). Accessible from Settings and quick-palette modal. |
| ⏰ **Sleep Timer with Volume Fade-Out** | Nov 26, 2026 • 18:13 IST | Auto-timer with presets (15m, 30m, 45m, 1h), "End of current track" watcher, or custom minute input. Features gentle 20-second volume fade-out before playback automatically pauses. |
| 🌊 **Audio Visualizer & Waveforms** | Nov 26, 2026 • 18:13 IST | Real-time audio reactive 60 FPS canvas visualizer featuring 3 switchable modes: Spectrum Frequency Bars, Layered Flowing Oscillogram Waves, and Pulsing Particles. Powered by Web Audio AnalyserNode with rhythmic beat-clock fallback. |
| 🎚️ **5-Band Sound Equalizer & Bass Boost** | Nov 26, 2026 • 18:13 IST | Precision 5-band biquad filter graphic EQ (60 Hz, 230 Hz, 910 Hz, 3.6 kHz, 14 kHz), 9 genre presets (Rock, Pop, Electronic, Vocal, Acoustic, Flat, etc.), live interactive SVG frequency response curve, and dedicated +12dB punchy Sub-Bass Booster. |
| 🖼️ **Floating Mini-Player & PiP** | Nov 26, 2026 • 18:13 IST | Draggable floating glass player card with position persistence across page navigation, artwork expander, full playback scrubbers/controls, and native browser Picture-in-Picture (`video.requestPictureInPicture`). Quick shortcut: `P`. |

---

### 🎵 Core & Established Architecture Features

| Core Feature | Capabilities |
|---|---|
| 🔄 **Unlimited Playlist Import** | No track limits; supports YouTube Music (continuation tokens), Spotify (Pathfinder API pagination), Deezer (public API), and Apple Music / iTunes. |
| 🎯 **Multi-Source Strict Matching** | Automatic matching across YouTube Music catalog (primary), iTunes metadata lookup, and YouTube video search fallback with low-quality upload rejection. |
| 🔒 **Proxy Streaming Architecture** | Built-in proxy client for cross-origin API and streaming requests, Deezer/Spotify CORS bypass, and Cloudflare Worker proxy integration for iOS Safari. |
| 🎧 **Seamless Playback, Radio & Automix Engine** | Continuous same-genre auto-loading radio queue, auto-skip intros/end-credits (SponsorBlock + lyrics + silence tail), shuffle, repeat, crossfade, and Web Audio DJ Automix transitions. |
| 🎚️ **10-Band Studio EQ & Audio Visualizer** | Dedicated Web Audio biquad filter pipeline (32 Hz – 16 kHz), 14 studio presets, JSON import/export, +12 dB sub-bass booster, and 60 FPS canvas waveform/bar/particle visualizer. |
| 🎤 **Word-Timed Lyrics Engine** | Powered by `@uimaxbai/am-lyrics` with TTML / LRC multi-provider fallback (Musixmatch, LRCLIB, Apple, YouTube) with full-screen and panel views. |
| 👥 **Listen Together & Live Presence** | Real-time party room sync for shared listening sessions, synced transport, and Discord Rich Presence integration. |
| 📱 **Apple Glassmorphism UI** | Apple Music inspired design system with SF Pro Display typography, smooth scrubbers, ambient glow mesh backdrops, and responsive layouts. |

---

### 💫 Apple-Grade Fluid Motion & Animation Architecture

BitChord features an animation pipeline calibrated to match native iOS and macOS Apple Music standards:

- **GPU-Accelerated 60/120 FPS Rendering (`transform` & `opacity`)**:
  - Zero Layout Shifts (CLS = 0): Animations exclusively target compositor layers via `transform`, `opacity`, and `will-change`, preventing expensive browser reflows and layout thrashing.
- **Breathing Artwork Radiosity Pulse (`4.5s ease-in-out`)**:
  - When music plays, a blurred, hyper-saturated replica behind the album art breathes with an ambient mesh bloom (`translateY(8px..12px)`, `scale(0.96..1.02)`, `blur(22px..32px)`).
  - Pausing the track smoothly settles the artwork into its resting geometry via cubic-bezier spring curves.
- **Tactile Spring Physics on Transport Buttons**:
  - Buttons respond to touch and mouse input with physical micro-interactions: `hover:scale-108` and `active:scale-92` with `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Theme-Adaptive Audio Visualizer**:
  - The real-time canvas visualizer dynamically samples the user's active theme accent (`--keyColor`), generating smooth linear gradients with pure white illuminated tips at frequency peaks.
- **Spring Modal Popups (`animate-spring-popup`)**:
  - Modals and contextual dialogs enter with custom Apple spring physics (`scale(0.92) translateY(6px)` → `scale(1) translateY(0)` in 320ms).
- **Apple-Glass Startup Splash Sequence (`StartupScreen.tsx`)**:
  - Launches with GPU-composited key-color radiosity bloom (`startup-glow`), expanding sonar rings (`startup-ring`), diagonal glass light-sheen sweep (`startup-sheen`), spring-scaled `LogoMark`, and a 5-bar animated equalizer (`startup-eq`), with `prefers-reduced-motion` and tap-to-skip support.

---

### 🔮 Future Features Tracker

*This section automatically documents upcoming features as they are implemented, logging their exact implementation date, time, and functional description:*

| Feature | Target Status | Planned Capabilities |
|---|---|---|
| ⏳ *Next Implemented Feature* | *Pending* | *Will be logged with exact implementation timestamp and technical notes upon deployment.* |

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
