<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=ISO%20pod&fontSize=46&fontColor=fff&animation=twinkling&fontAlignY=32&desc=Pure%20Sound.%20Pocket%20Hi-Fi.%20%E2%80%A2%20Unlimited%20Import%20%E2%80%A2%20Seamless%20Playback&descAlignY=54&descSize=16&descColor=ccc"/>

<img src="web/app/public/logo.png" alt="ISO pod Logo" width="120" height="120"/>

### **ISO pod** — *Pure Sound. Pocket Hi-Fi.*

[![GitHub Stars](https://img.shields.io/github/stars/Rohanjm911/IOS-pod?style=for-the-badge&logo=github&color=gold)](https://github.com/Rohanjm911/IOS-pod/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

</div>

---

## ✨ What is ISO pod?

**ISO-pod (Web App Version)** (*Pure Sound. Pocket Hi-Fi.*) is an open‑source music streaming platform based on **BitChord**, built primarily for **iOS devices** and also seamlessly usable across Android, tablets, laptops, and desktop browsers — no subscriptions required. It lets you **import playlists from any major streaming service** and enjoy uninterrupted, high‑fidelity playback anywhere.

> Import from Spotify, YouTube Music, Deezer, Audius, and Apple Music / iTunes → Match tracks across multiple sources → Play with **4 switchable UI styles** (**Glassmorphism**, **Neo-Brutalism**, **Editorial Magazine**, **Bento Grids**), theme-matched startup splashes & Web Audio sound engines, single-line live lyrics, 10-band studio EQ, and YouTube Music auto-skip.

---

## 🧰 Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,vitest,pnpm,vercel,cloudflare&perline=8" alt="ISO pod Core Tech Stack" />

</div>

| Layer | Technologies |
|---|---|
| **Frontend & UI** | ![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white) ![Lucide](https://img.shields.io/badge/Lucide_Icons-F56565?style=flat-square&logo=lucide&logoColor=white) |
| **State & Data** | ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=react&logoColor=white) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white) ![IndexedDB](https://img.shields.io/badge/IndexedDB_(idb)-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| **Audio, DSP & Streaming** | ![Web Audio API](https://img.shields.io/badge/Web_Audio_API-FF5722?style=flat-square&logo=webaudio&logoColor=white) ![Shaka Player](https://img.shields.io/badge/Shaka_Player-4285F4?style=flat-square&logo=googlechrome&logoColor=white) ![HLS.js](https://img.shields.io/badge/HLS.js-000000?style=flat-square&logo=youtube&logoColor=white) ![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime_Web-005CED?style=flat-square&logo=onnx&logoColor=white) ![Essentia.js](https://img.shields.io/badge/Essentia.js-8B5CF6?style=flat-square&logo=musicbrainz&logoColor=white) |
| **Build, Edge & Testing** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white) ![Vercel Edge](https://img.shields.io/badge/Vercel_Edge-000000?style=flat-square&logo=vercel&logoColor=white) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflareworkers&logoColor=white) |

---

## 🚀 Features & Implementation Timeline

### 🆕 Newly Implemented Features

| # | Feature | Implementation Date & Time | Description |
|---|---|---|---|
| **1.** | 📱🔄 **Landscape Mode Optimization Across All 4 UI Themes (`tokens.css`, `global.css`)** | Nov 28, 2026 • 00:29 IST | Added `@media (orientation: landscape) and (max-height: 580px)` layout & theme optimizations across **Glassmorphism**, **Neo-Brutalism**, **Editorial Magazine**, and **Bento Grids**: compact sidebar item height, slimmer floating PlayerBar, clamped Full-Screen Player artwork (`--art: clamp(104px, 32dvh, 184px)`), and tighter shelf/card padding & shadows for short landscape screens, verified with `uiThemes.test.tsx`. |
| **2.** | 🧼📜 **Global Hidden Scrollbars (`global.css`, `AppShell.tsx`, `UpNext.tsx`)** | Nov 28, 2026 • 00:22 IST | Hid visual scrollbars across the entire app (`scrollbar-width: none`, `-ms-overflow-style: none`, `*::-webkit-scrollbar { display: none }`) and removed `[scrollbar-gutter:stable]` from `#scrollable-page`, keeping wheel, touch, and keyboard scrolling completely functional without visible scrollbar tracks. |
| **3.** | ⚡📦 **Bundle Code-Splitting, Lazy Modals & Scroll Paint Optimization** | Nov 28, 2026 • 00:19 IST | Optimized `vite.config.ts` (`es2022` target + Rolldown `manualChunks` splitting `vendor-react`, `vendor-state`, `vendor-icons`, and `vendor-youtube`), lazy-loaded on-demand modals (`EqualizerModal`, `SleepTimerModal`, `ThemeModal`, `UiRestartDialog`) in `AppShell.tsx`, and added `content-visibility: auto` on `#scrollable-page section` in `global.css` to skip off-screen shelf layout/paint. |
| **4.** | 💾⏯️ **Retained Last Played Songs & Playhead on Restart (`player.ts`, `HomePage.tsx`)** | Nov 28, 2026 • 00:16 IST | Hardened playback session & recent-history retention across app restarts: preserved `resumeState` playhead in `getPlayhead()`, `persistPlaybackSession()`, and unloaded-audio `togglePlay()` resumes, and merged persisted `localLibrary.recentTracks` into `HomePage.tsx` `useRecentlyPlayed()` so Home & Library retain last played songs even offline or without YouTube sign-in. |
| **5.** | ⏭️▶️ **YouTube Music-Only Auto-Skip Intros (`introOutroSkip.ts`, `player.ts`)** | Nov 28, 2026 • 00:11 IST | Restricted `prepareIntroOutroSkip()` and `maybeSkipIntroOutro()` using `isYouTubeMusicSource(videoId, client)` so SponsorBlock, synced-lyric intro/outro detection, and trailing silence auto-skip run **only** for YouTube Music tracks and streams—leaving Audius, iTunes, Spotify, addon, and local tracks untouched. |
| **6.** | 🔊🎭 **4 Theme-Matched Startup Sound Engines (`StartupScreen.tsx`)** | Nov 28, 2026 • 00:04 IST | Upgraded `playStartupSound(uiMode)` with 4 custom-synthesized Web Audio signatures matched to each UI style: **Glassmorphism** (Cinema `"Ta-Dum"` + orchestral brass swell), **Neo-Brutalism** (square sub-stomp + gritty sawtooth power chord), **Editorial Magazine** (mechanical typewriter clicks + warm Rhodes `Fmaj9` chord), and **Bento Grids** (Apple-inspired crystalline `Cmaj9` chime arpeggio). |
| **2.** | 🪟✨ **Primary UI: Frosted Glassmorphism Upgrade** | Nov 27, 2026 • 23:59 IST | Enhanced **Primary UI** (`[data-ui-mode="primary"]` in `global.css`) into a full **Apple-Grade Glassmorphism** system: added ambient multi-color radial aura behind `#scrollable-page`, `24px–28px` saturated backdrop blur on `.glass-material`, `.glass-pill`, modals, and frosted translucent glass cards with `1px` luminous inner highlights across shelves and settings. |
| **2.** | 🎵💬 **Single-Line Live Lyrics in PlayerBar LCD** | Nov 27, 2026 • 23:55 IST | Added `useLiveLyricLine()` in `Lcd.tsx` (sharing the `useLyrics()` cache + `parseTtml`) to display the active synced lyric line right inside the floating PlayerBar subtitle with a subtle rising fade animation (`lcd-lyric-in` in `global.css`), seamlessly falling back to artist credits during instrumental gaps or unsynced tracks. |
| **2.** | 🎨🎤 **Theme-Adaptive Full-Screen Player & Lyrics Typography** | Nov 27, 2026 • 23:52 IST | Updated `FullScreenPlayer.tsx` (`MeshBackdrop` + `--keyColor` theme-tint wash) and `LyricsPanel.tsx` Shadow DOM (`am-lyrics`) so both the Full-Screen Player screen and lyrics font/highlight colors (`Playfair Display` serif in Editorial, geometric sans in Neo-Brutalism, Apple sans in Bento, SF Pro in Primary) adapt dynamically to the active UI style, palette, and Dark/Light theme. |
| **2.** | 🧩🍏 **4th UI Style: Apple-Inspired Bento Grids** | Nov 27, 2026 • 23:46 IST | Added the 4th full-app UI style (`bento`: **Bento Grids**) with Apple-style `#F5F5F7`/`#FFFFFF`/`#1D1D1F`/`#007AFF`/`#34C759` modular rounded tiles (`1.5rem`), Dark/AMOLED mode contrast, soft elevation & `scale(1.02)` hover lift, staggered `bento-reveal` animations, and a 4-tile modular Bento grid `StartupScreen.tsx` showcase. |
| **2.** | 📰✒️ **3rd UI Style: Editorial Grid / Magazine** | Nov 27, 2026 • 23:42 IST | Added the 3rd full-app UI style (`editorial`: **Editorial Magazine**) with Playfair Display serif display headlines, `#000000`/`#FFFFFF`/`#DC2626`/`#6B7280` print palette + Dark/AMOLED compatibility, `2px` section top rules, crimson active nav accents, scroll-driven rising headlines (`editorial-rise`), and a print-cover `StartupScreen.tsx` masthead animation (`editorial-rule`). |
| **2.** | 💾🎶 **Unlimited Persistent Imported Playlists (IndexedDB)** | Nov 27, 2026 • 23:39 IST | Upgraded `localLibrary.ts` to store imported playlists, favorites, and recent tracks in **IndexedDB** (`isopod-library` via `idb`) alongside a `localStorage` fallback & legacy `bitchord:local-library` migration—preventing large imported playlists from hitting the 5 MB `localStorage` quota and disappearing after app restarts. |
| **2.** | 🎬🟨 **Dual-Style Startup Screen & Animations (`StartupScreen.tsx`)** | Nov 27, 2026 • 23:33 IST | `StartupScreen.tsx` now adapts to the active UI style: **Primary UI** plays the fluid Netflix-style multi-color ribbon & zoom splash (`netflix-ribbon`, `netflix-zoom`, `startup-sheen`), while **Secondary UI** launches a distinct **Neo-Brutalism Dual-Tone** splash with a scrolling top marquee (`brutal-marquee`), hard-slam poster card (`brutal-slam`), snap-rotated badge (`brutal-badge-pop`), and stepped dual-tone stomp bars (`brutal-bar-stomp`). |
| **2.** | 🏠✨ **Multi-Source Home Recommendations (Audius + iTunes + YTM)** | Nov 27, 2026 • 23:30 IST | Upgraded `HomePage.tsx` with `homeRecommendations.ts` + `externalSources.ts` (`fetchAudiusTrendingTracks`, `fetchItunesChartTracks`): surfaces personalized *"Because You Listened to …"* mixes, **Trending on Audius** (320kbps direct Hi-Fi), **Top Charts • India & Global** (Apple iTunes RSS), and time-of-day vibe shelves alongside YouTube Music—and keeps Home rich & playable even without the browser extension. |
| **3.** | 🟨⬛ **Secondary UI: Neo-Brutalism Dual-Tone System** | Nov 27, 2026 • 23:21 IST | Designed the full **Secondary UI** (`[data-ui-mode="secondary"]` in `global.css`) in **Neo-Brutalism** style across the main shell, Settings, Full-Screen Player (`[data-full-screen]` + Lyrics), and Dark/AMOLED modes: flat poster surfaces, `2px–3px` solid ink borders, hard offset shadows (`3px–7px`), auto dark/AMOLED ink & surface contrast, 5 curated Dual-Tone palettes (`Acid & Ink`, `Cobalt & Volt`, `Poster Red`, `Tangerine Dark`, `Mint Obsidian`), and custom `Tone 1` / `Tone 2` color pickers. |
| **4.** | 🎭🔄 **App UI Look Switcher & Restart Confirmation Flow** | Nov 27, 2026 • 23:06 IST | Added full-app `uiMode` (`primary` / `secondary`, persisted in `isopod:ui-mode` + pre-paint `data-ui-mode` in `index.html`), exposed the **App UI Look** switcher in `ThemeModal.tsx` and `SettingsPage.tsx`, and built `UiRestartDialog.tsx` to prompt user confirmation (`Cancel` / `Restart & Apply`) before restarting the app via `window.location.reload()`. |
| **5.** | 🔊✨ **Startup Sound Autoplay Unlock & Full Tail** | Nov 27, 2026 • 22:44 IST | Fixed `StartupScreen.tsx` Web Audio startup sound being cut short on unmount or silently blocked by browser autoplay policy: preserved the 2.45s `AudioContext` tail across splash exit so the orchestral chord rings out completely, and added a `"Tap anywhere for Cinema Sound"` prompt when the browser suspends audio before a gesture. |
| **6.** | 🎧🌙 **Background Playback & Lock-Screen Keep-Alive** | Nov 27, 2026 • 22:35 IST | Added `backgroundAudio.ts` with a silent 1s 8-bit PCM WAV loop (`volume: 0.001`, `playsinline`) to keep iOS/Android OS audio sessions & `MediaSession` lock-screen controls alive across track-switch gaps and YouTube IFrame playback; added `visibilitychange`/`pageshow`/`focus` `AudioContext` + playback auto-resume in `player.ts`; and added automatic background resume in `IframePlayerAdapter.ts` when browsers auto-pause hidden iframes. |
| **7.** | 💿🔄 **Vinyl Mode Spin & Spindle Fix** | Nov 27, 2026 • 10:24 IST | Fixed `FullScreenPlayer.tsx` vinyl mode not spinning when Apple `MotionArtwork` overlaid the static `<img>`: wrapped both artwork and `MotionArtwork` in a dedicated rotating disc container (`spin 14s linear infinite`, paused when playback pauses) and placed the vinyl center spindle at `z-10` above motion art. |
| **8.** | 🛠️📱 **Landscape PlayerBar & Customizer Popover Fix** | Nov 27, 2026 • 10:20 IST | Fixed `PlayerBar.tsx` overflow/squashed LCD on compact & phone-landscape widths (`< 1024px`) by adding `overflow-hidden` on the pill & LCD container and collapsing secondary controls (`Shuffle`, `Repeat`, `Favorite`, `TrackMenu`) into Quick Tools / Full-Screen; prevented `Sidebar.tsx` tagline wrapping; and added `max-h-[calc(100dvh-...)] overflow-y-auto` to the `FullScreenPlayer.tsx` Customizer popover so its header never clips on short screens. |
| **9.** | 📱🖥️ **All-Screen Responsive Optimization** | Nov 27, 2026 • 10:13 IST | Added responsive layout tokens in `tokens.css` for small phones (`<=420px`: `16px` gutter), tablets (`768px–1023px`: `220px` sidebar), and ultrawide monitors (`>=1600px`: fluid gutter + `340px` side panel); switched `EqualizerModal`, `ThemeModal`, and `SleepTimerModal` to `100dvh` + safe-area padding; added `touch-action: manipulation`, `overscroll-y-contain`, tighter mobile `--art` bounds in `FullScreenPlayer.tsx`, and `xl`/`2xl` grid columns in `SearchPage.tsx`. |
| **10.** | 📐💿 **Full-Screen Vinyl & Card Alignment Fix** | Nov 27, 2026 • 10:03 IST | Fixed `FullScreenPlayer.tsx` centered card overflow where `.fullscreen-art` used `w-(--art)` inside a padded `w-(--art)` container, causing the vinyl disc to touch the right edge; centered artwork with balanced `p-6 pb-5` card padding and clean visualizer bottom spacing. |
| **11.** | 🧹✨ **Complete "BitChord" → "ISO pod" App Scrub** | Nov 27, 2026 • 09:54 IST | Replaced all remaining `BitChord` / `bitchord` references across UI pages, modals, Discord/Spotify/YouTube/Extension prompts, Audius `app_name`, EQ export filenames, CSS custom properties & font family (`ISOpod SF Pro Display`), `localStorage` keys (`isopod:*`), browser extension metadata (`wxt.config.ts`), and edge proxy service labels. |
| **12.** | 🔊🎬 **Dramatic Cinema Startup Sound Engine** | Nov 27, 2026 • 09:44 IST | Upgraded `StartupScreen.tsx` Web Audio synthesizer with a dynamics compressor, cinema-hall echo tail, pre-hit filtered noise whoosh riser, dual-layer `"Ta-Dum"` sub-bass drop (`94 Hz → 38 Hz`), and a 6-voice detuned orchestral synth-brass chord swell synced with the multi-color ribbon burst. |
| **13.** | 🎨💿 **Custom ISO-POD Logo & Icon Suite** | Nov 27, 2026 • 09:42 IST | Replaced the old app logo everywhere with the new circular **ISO-POD** badge (`logo.png`), anti-aliased with transparent edges and generated across all sizes (`favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`), plus updated `LogoMark.tsx`, `index.html`, and the circular Netflix-style `StartupScreen.tsx` centerpiece. |
| **14.** | 🏷️🎧 **App Rebrand to "ISO pod" + Tagline** | Nov 27, 2026 • 09:36 IST | Rebranded all user-facing app titles, manifest (`manifest.webmanifest`), `index.html`, Netflix-style `StartupScreen.tsx`, `Sidebar.tsx`, `MobileTopBar.tsx`, and empty/status prompts to **ISO pod** with the fitting tagline **"Pure Sound. Pocket Hi-Fi."** |
| **15.** | 🛡️⏱️ **Site-Wide Proxy & Client Rate Limiter** | Nov 27, 2026 • 09:24 IST | Implemented multi-layer rate limiting across the entire site: sliding-window per-IP rate limiting (`120` API reqs/min, `240` media/range reqs/min, bounded bucket pruning, `429 Retry-After` + `X-RateLimit-*` headers) in Vercel Edge (`api/proxy.js`, `web/api/proxy.js`), Cloudflare Worker (`web/ios-proxy/worker.js`), and Vite local proxy (`vite.config.ts`), paired with a token-bucket + 429-backoff client rate limiter (`rateLimiter.ts`) integrated into search and external source APIs. |
| **16.** | 🎨💿 **Mochy-Style Full-Screen Player Customizer** | Nov 27, 2026 • 01:45 IST | Added a live inline Full-Screen Customizer (`FullScreenPlayer.tsx` + `ui.ts`) accessible via the top **Customize** pill or bottom **Sparkles** icon: switch Artwork Styles (**Classic**, spinning **Vinyl** disc with center spindle, **Soft** squircle, **Minimal**), Backdrops (**Mesh**, **Aurora**, **Frosted**, **AMOLED**), Stage Layouts (**Apple Split**, **Mochy Flip**, **Glass Card**), and Audio Visualizer visibility with instant persistence. |
| **17.** | 🎛️✨ **Customizable Player Bar Styles** | Nov 27, 2026 • 01:14 IST | Added 4 live-switchable Player Bar visual styles (`Apple Glass`, `Compact Pill`, `Studio Dock`, and `Neon Glow`) persisted in `ui.ts` (`bitchord:player-style`), selectable from both the quick Theme Customizer modal (`ThemeModal.tsx`) and `SettingsPage.tsx`, and applied dynamically across desktop `PlayerBar.tsx` and `MobilePlayerBar.tsx`. |
| **18.** | 🛡️▶️ **Resilient Multi-Tier Playback & Embed Fallback Fix** | Nov 27, 2026 • 00:00 IST | Fixed intermittent playback failures when tracks hit YouTube embed restrictions (`Error 101/150`) or bot-gates: filtered out non-YouTube IDs (`audius:` / `itunes:`) from YouTube IFrame `tryEmbed`, parallelized `searchSongs` + `searchMainVideos("${query} audio")` up to 6 embeddable fallback candidates, added Audius full-MP3 stream fallback in `YouTubeEngine.load()` catch recovery, and enabled automatic radio advance when a single unplayable track fails. |
| **19.** | 🌐🎵 **Multi-Source Built-In Song Fetching & Streaming (Audius + iTunes)** | Nov 26, 2026 • 23:39 IST | Added built-in non-YouTube music fetching and playback (`externalSources.ts`): integrates **Audius Discovery Network** (direct 320kbps MP3 full-track streaming, CORS-enabled, zero bot-gate, full 10-band EQ & visualizer support) and **Apple iTunes Search API** into `fetchSearch`, `searchSongs`, `genreRadio.ts`, and `YouTubeEngine.load()` automatic fallback—so songs search, load, and play even without YouTube or browser extensions. |
| **20.** | 🌟🚀 **Netflix-Style Multi-Color Startup Splash Screen & Sound** | Nov 26, 2026 • 23:52 IST | Upgraded `StartupScreen.tsx` with a cinematic pitch-black stage, 10 Netflix-inspired multi-color vertical spectrum light ribbons (`netflix-ribbon`), conic-gradient ambient glow, spring-scaled glass `LogoMark` badge with light-sheen sweep, multi-color gradient `"BitChord"` wordmark with `netflix-zoom` transition, 5-bar neon equalizer, synthesized Web Audio `"Ta-Dum"` sub-bass + harmonic chord startup sound effect (isolated strictly to startup), tap-to-skip, and `prefers-reduced-motion` support. |
| **21.** | ⏩🎬 **Auto-Detect & Skip Intros & End Credits** | Nov 26, 2026 • 23:26 IST | Multi-tier automatic intro, non-music skit, and end-credits skipper: Tier 1 queries SponsorBlock (`music_offtopic`, `intro`, `outro`) with segment merging and caching; Tier 2 analyzes synced lyrics vocal boundaries (`>= 20s` opening delay and `>= 18s` trailing credits); Tier 3 monitors real-time Web Audio `AnalyserNode` silence tails (`>= 4s`) to automatically advance to the next track; plus user toggle in Settings and manual-seek re-watch protection. |
| **22.** | ⏭️⏮️ **Next & Previous Transport Buttons Fix** | Nov 26, 2026 • 20:05 IST | Resolved non-functional Next and Previous track controls across PlayerBar, FullScreenPlayer, MiniPlayer, and MobilePlayerBar: eliminated artificial `!hasNext` button disabling so transport is always active; wired hardware `unlockAudioOnGesture()` to both buttons to prevent browser audio context drops; enhanced `previous()` with double-tap (<2s) and beginning-of-track detection to instantly jump to previous tracks instead of perpetually seeking to 0; and strengthened `advance()` with auto-looping, same-genre radio refill, and automatic skipping of unplayable tracks. |
| **23.** | 📻🎶 **Intelligent Same-Genre Auto-Loading Radio Engine** | Nov 26, 2026 • 19:55 IST | Automatically detects the musical genre and acoustic vibe of any currently playing song (via iTunes Search API with fallback heuristic taxonomy across Bollywood, Punjabi, Dance/EDM, Rock, Pop, Hip-Hop, Lo-Fi, etc.), auto-loads a continuous Up Next queue of same-genre tracks with multi-tier fallback (YouTube Music Radio -> YTM Songs shelf -> YouTube Video Search), dynamically refills the queue when low (<= 2 tracks), and eliminates stalled or abrupt playback endings. |
| **24.** | 🔊🔇 **Volume Slider & Mute Toggle Bridge Fix** | Nov 26, 2026 • 19:40 IST | Fixed master volume slider and mute speaker button by keeping `deck.audio.volume` and `deck.audio.muted` synchronized across both IframePlayerAdapter (YouTube Iframe embed bridge) and native HTMLMediaElement outputs alongside Web Audio `eqMasterGain`, added continuous real-time `onInput` dragging, added `stopPropagation` on mute button taps, and auto-restored 50% volume when unmuting from 0%. |
| **25.** | ⚡🔊 **Studio Equalizer Live DSP Routing Engine Fix** | Nov 26, 2026 • 19:35 IST | Decoupled 10-Band Equalizer from the heavy Automix DJ scheduler into a dedicated Web Audio DSP pipeline; attached deck HTMLAudioElements directly via cached MediaElementAudioSourceNodes; wired hardware gesture AudioContext automatic resume across all gestures, slider adjustments, and preset clicks; routed master and deck fader volumes cleanly through eqMasterGain; and restored live real-time audible acoustic processing with visual pulsing DSP indicators. |
| **26.** | 🎚️ **10-Band Studio Sound Equalizer with Custom Preset Import/Export** | Nov 26, 2026 • 19:05 IST | Upgraded from 5 to 10 ISO octave frequency bands (32 Hz to 16 kHz), added 14 popular studio genre presets (Bass Boost, Bass Reducer, Vocal Booster, Treble Booster, EDM, Rock, Hip-Hop, Pop, Acoustic, Classical, Jazz, Deep Lounge, Dialogue), wired real-time Web Audio biquad filter chain directly into playback, and added full custom preset management with JSON import/export and 5-to-10 band interpolation. |
| **27.** | ✨ **Apple-Grade Micro-Animations & Motion Polish** | Nov 26, 2026 • 18:55 IST | Hardware-accelerated dynamic artwork radiosity breathing bloom (`4.5s` pulse during playback), spring modal popups (`cubic-bezier(0.16, 1, 0.3, 1)`), tactile spring physics on transport controls (`hover:scale-108 active:scale-92`), and accent-color reactive audio visualizer with illuminated white tips. |
| **28.** | ⚡ **Lyrics Animation Polish & Zero-Delay Sync Engine** | Nov 26, 2026 • 18:51 IST | Removed awkward line bobbing/wobble and character jitter; introduced rock-solid Apple Music typography, clean opacity hierarchy (no greasy blur), and crystal-clear ambient radiosity glow. Accelerated clock slew rate (`CORRECTION_MS = 150`, `MAX_SLEW = 0.75`), added +220ms lead-in compensation to eliminate hardware audio buffer delay, and integrated custom sync offset slider (-200ms to +600ms) in Lyric Settings. |
| **29.** | 🎛️ **PlayerBar & Landscape Responsive Layout** | Nov 26, 2026 • 18:45 IST | Glass-pill dynamic responsive expansion (up to 840px), intelligent Quick Tools contextual popover (`SlidersHorizontal`), auto-collapsing utility buttons when side panels open, preventing UI truncation and LCD title squashing across all screen sizes. |
| **30.** | 🎤 **Fluid Apple Music Lyric Animations** | Nov 26, 2026 • 18:37 IST | Spring-driven active line entrance elevation (`scale(1.045)`), dynamic breathing radiosity karaoke glow with key-color ambient bloom, 3D progressive depth-of-field blur on inactive lines, syllable karaoke pop, tactile seek hover highlights, and dancing instrumental gap dots. |
| **31.** | 📱 **Landscape Mode Formatting Overhaul** | Nov 26, 2026 • 18:32 IST | Redesigned FullScreenPlayer layout for landscape and compact heights (≤620px): side-by-side artwork + metadata header row, isolated z-20 bottom action bar eliminating control collisions, compact scrubber, 38px transport, and auto-scaled 22px visualizer. |
| **32.** | 🖤 **Pure AMOLED Pitch Black Mode** | Nov 26, 2026 • 18:24 IST | True `#000000` pitch-black dark theme for zero-power display efficiency on OLED/AMOLED screens, deep contrast, and true-black shelves and sidebars. |
| **33.** | 🎨 **Custom Accent Colors & iOS Palettes** | Nov 26, 2026 • 18:24 IST | Live HTML5 color picker and hex input for custom button/accent tinting, 10 quick vibrant color swatches, plus 9 curated iOS palettes (Neon Pink, Electric Blue, Sunset Coral, Mint, Violet, Amber, Emerald, Cyan, Crimson). |
| **34.** | 🪟 **Glassmorphism Customizer** | Nov 26, 2026 • 18:24 IST | 4-tier background blur and translucency customization: Apple Glass (32px), Ultra Frosted (48px high saturation), Subtle Glass (12px), and Solid Flat (0px blur for high performance). Accessible from Settings and quick-palette modal. |
| **35.** | ⏰ **Sleep Timer with Volume Fade-Out** | Nov 26, 2026 • 18:13 IST | Auto-timer with presets (15m, 30m, 45m, 1h), "End of current track" watcher, or custom minute input. Features gentle 20-second volume fade-out before playback automatically pauses. |
| **36.** | 🌊 **Audio Visualizer & Waveforms** | Nov 26, 2026 • 18:13 IST | Real-time audio reactive 60 FPS canvas visualizer featuring 3 switchable modes: Spectrum Frequency Bars, Layered Flowing Oscillogram Waves, and Pulsing Particles. Powered by Web Audio AnalyserNode with rhythmic beat-clock fallback. |
| **37.** | 🎚️ **5-Band Sound Equalizer & Bass Boost** | Nov 26, 2026 • 18:13 IST | Precision 5-band biquad filter graphic EQ (60 Hz, 230 Hz, 910 Hz, 3.6 kHz, 14 kHz), 9 genre presets (Rock, Pop, Electronic, Vocal, Acoustic, Flat, etc.), live interactive SVG frequency response curve, and dedicated +12dB punchy Sub-Bass Booster. |
| **38.** | 🖼️ **Floating Mini-Player & PiP** | Nov 26, 2026 • 18:13 IST | Draggable floating glass player card with position persistence across page navigation, artwork expander, full playback scrubbers/controls, and native browser Picture-in-Picture (`video.requestPictureInPicture`). Quick shortcut: `P`. |

---

### 🎵 Core & Established Architecture Features

| Core Feature | Capabilities |
|---|---|
| 🔄 **Unlimited Playlist Import** | No track limits; supports YouTube Music (continuation tokens), Spotify (Pathfinder API pagination), Deezer (public API), and Apple Music / iTunes. |
| 🎯 **Multi-Source Strict Matching** | Automatic matching across YouTube Music catalog (primary), iTunes metadata lookup, and YouTube video search fallback with low-quality upload rejection. |
| 🔒 **Proxy Streaming & Rate Limiting** | Multi-layer sliding-window per-IP rate limiting (`120` API / `240` media reqs/min) across Vercel Edge, Cloudflare Worker, and Vite local proxy, plus client token-bucket + 429 backoff. |
| 🎧 **Seamless Playback, Radio & Automix Engine** | Continuous same-genre auto-loading radio queue, auto-skip intros/end-credits (SponsorBlock + lyrics + silence tail), shuffle, repeat, crossfade, and Web Audio DJ Automix transitions. |
| 🎚️ **10-Band Studio EQ & Audio Visualizer** | Dedicated Web Audio biquad filter pipeline (32 Hz – 16 kHz), 14 studio presets, JSON import/export, +12 dB sub-bass booster, and 60 FPS canvas waveform/bar/particle visualizer. |
| 🎤 **Word-Timed Lyrics Engine** | Powered by `@uimaxbai/am-lyrics` with TTML / LRC multi-provider fallback (Musixmatch, LRCLIB, Apple, YouTube) with full-screen and panel views. |
| 👥 **Listen Together & Live Presence** | Real-time party room sync for shared listening sessions, synced transport, and Discord Rich Presence integration. |
| 📱 **All-Screen Responsive & Customizer UI** | Adaptive layout tokens for small phones (`<=420px`), tablets (`768px–1023px`), laptops, and ultrawide (`>=1600px`) screens, with live Artwork/Backdrop/Layout/Player-Bar customizers and AMOLED black mode. |

---

### 💫 Apple-Grade Fluid Motion & Animation Architecture

**ISO pod** features an animation pipeline calibrated to match native iOS and macOS Apple Music standards:

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
- **4 Theme-Matched Startup Splashes & Sound Engines (`StartupScreen.tsx`)**:
  - **Glassmorphism**: GPU-composited spectrum ribbons (`netflix-ribbon`), conic glow, sonar rings, diagonal light-sheen sweep, and a Web Audio `"Ta-Dum"` sub-bass + 6-voice orchestral synth-brass swell.
  - **Neo-Brutalism**: Scrolling dual-tone marquee (`brutal-marquee`), hard-slam poster card, stepped stomp bars, and a square sub-stomp + sawtooth power chord.
  - **Editorial Magazine**: Masthead rule (`editorial-rule`), Playfair Display serif cover, typewriter clicks, and a warm `Fmaj9` Rhodes chord.
  - **Bento Grids**: 4-tile modular Apple-style grid (`bento-reveal`) with a crystalline `Cmaj9` chime arpeggio — all supporting `prefers-reduced-motion` and tap-to-skip.

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
git clone https://github.com/Rohanjm911/IOS-pod.git
cd IOS-pod/web/app

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
3. ISO pod fetches **all tracks** (no limit!) and matches each one across multiple sources
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
# Run all tests (29 test files, 207 tests)
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
