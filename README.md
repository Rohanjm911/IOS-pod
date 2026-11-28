<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=ISO%20pod&fontSize=46&fontColor=fff&animation=twinkling&fontAlignY=32&desc=Pure%20Sound.%20Pocket%20Hi-Fi.%20%E2%80%A2%20Unlimited%20Import%20%E2%80%A2%20Seamless%20Playback&descAlignY=54&descSize=16&descColor=ccc"/>

<img src="web/app/public/logo.png" alt="ISO pod Logo" width="120" height="120"/>

### **ISO pod** — *Pure Sound. Pocket Hi-Fi.*

<a href="#-features">
  <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=600&size=18&duration=2600&pause=900&color=FA243C&center=true&vCenter=true&width=640&lines=Pure+Sound.+Pocket+Hi-Fi.;USB+DAC+Bit-Transparent+Routing+%E2%80%A2+44.1%E2%80%93192+kHz;Precision+Multi-Signal+Music+Taste+Engine;6+Switchable+UI+Styles+%E2%80%A2+10-Band+Studio+EQ" alt="ISO pod Animated Highlights" />
</a>

[![GitHub Stars](https://img.shields.io/github/stars/Rohanjm911/IOS-pod?style=for-the-badge&logo=github&color=gold)](https://github.com/Rohanjm911/IOS-pod/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

<p>
  <a href="#-what-is-iso-pod">Overview</a> &bull;
  <a href="#-tech-stack">Tech Stack</a> &bull;
  <a href="#-features">Features</a> &bull;
  <a href="#%EF%B8%8F-installation">Installation</a> &bull;
  <a href="#-usage">Usage</a> &bull;
  <a href="#-development">Development</a>
</p>

</div>

---

## ✨ What is ISO pod?

**ISO pod** (*Pure Sound. Pocket Hi-Fi.*) is an open‑source, multi-source Hi-Fi music streaming web app based on **BitChord**, engineered for **iOS**, **Android**, tablets, and desktop browsers — no subscriptions required. It lets you **import unlimited playlists from any major streaming service**, route bit-transparent audio straight to an external **USB DAC**, and enjoy personalized, taste-driven discovery.

> **Highlights:** Import from Spotify, YouTube Music, Deezer, Audius & iTunes → Precision multi-signal taste recognition → USB DAC `setSinkId` routing & DSP bypass (`48–192 kHz`) → **6 switchable UI styles** (**Glassmorphism**, **Neo-Brutalism**, **Editorial Magazine**, **Bento Grids**, **Retro iPod**, **Anime Studio**) with theme-matched typography, startup sound engines, word-timed lyrics, and 10-band studio EQ.

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

## 🚀 Features

| Icon | Feature | Capabilities |
| :---: | :--- | :--- |
| 🎧 | **Universal USB DAC & Hi-Res Audio** | Cross-platform auto-detection (phones, tablets & computers) for USB-C dongles, desktop DACs, studio interfaces & chipsets (`AB13X`, `CX31993`, `CS43131`, `ES90xx`, `AKM`); `setSinkId` routing, **OS Output Picker**, **DAC Direct Mode** (DSP bypass), **Unity Volume Lock (0 dB)**, and `44.1–192 kHz` sample rates. |
| 🔵 | **Bluetooth Devices & AVRCP Controls** | Detects & routes Bluetooth headsets/speakers (`AirPods`, `Sony`, `Bose`, `JBL`, `boAt`, etc.), displays theme-matched connect popups with **Device Name, BLE GATT Battery % & Profile/Rate**, and enables full **AVRCP hardware buttons** (`Play/Pause`, `Next`, `Prev`, `Stop`, `Seek`). |
| 🧠 | **Adaptive Music Taste Engine** | Learns from plays, completions (`>= 72%`), early-skip suppression (`< 35%`), favorites, playlists, **time-of-day habits** (`Morning`/`Afternoon`/`Evening`/`Late Night`), and live session momentum to power **Your Sound**, cyclic **On Repeat**, and Auto-Play radio. |
| 🎶 | **Full-Length Streaming & Auto-Recovery** | Streams from YouTube Music, Audius (320kbps full tracks), and iTunes metadata with short-clip filtering (`< 45s`), full-length stream upgrading, **1–2s auto-crossfade**, and premature stream-drop auto-resume. |
| 🎨 | **6 Full-App UI Styles & Fixed Palettes** | Switchable **Glassmorphism**, **Neo-Brutalism**, **Editorial Magazine**, **Bento Grids**, **Retro iPod**, and **Anime Studio** themes with locked signature colour schemes, theme-matched typography, and **AMOLED Pitch Black** mode. |
| 🔊 | **6 Theme-Matched Startup SFX & Splashes** | Custom Web Audio synthesized boot chimes and animated splashes tailored to each UI mode, with gesture unlock and `prefers-reduced-motion` support. |
| 🎤 | **Word-Timed Lyrics & EN/Hinglish Translation** | Non-overlapping fixed lyrics toolbar (`Romanize`, `Translate`, `Format`, `Download`), `@uimaxbai/am-lyrics` with keyless Spotify/Musixmatch fallbacks, **English & Hinglish** translation, **PlayerBar LCD** live lyrics, and theme animations. |
| 📶 | **Slow & Offline Network Joke Popups** | Detects very slow connections (`2G`/`< 0.45 Mbps`/`> 1400ms` RTT/`>= 7.5s` buffering) or offline drops and plays a gentle chime with a random network/offline joke. |
| 🎚️ | **10-Band Studio EQ & Visualizer** | Dedicated Web Audio biquad pipeline (`32 Hz – 16 kHz`), 14 studio presets, +12 dB sub-bass booster, JSON preset import/export, and 60 FPS spectrum/wave/particle canvas visualizer. |
| 🎧 | **Automix DJ & Smart Auto-Skip** | Beat-matched Web Audio DJ crossfades, continuous same-genre radio queue, and YouTube-only SponsorBlock / lyrics / trailing-silence intro & outro skipping. |
| 🔄 | **Unlimited Playlist Import & IndexedDB** | Import full playlists from Spotify, YouTube Music, Deezer & Apple Music with strict multi-source matching and unlimited **IndexedDB** (`idb`) persistence. |
| 👥 | **Listen Together & Discord Presence** | Real-time party room playback sync across listeners plus live Discord Rich Presence integration. |
| 🖼️ | **Floating Mini-Player & PiP** | Draggable floating glass player card, spinning Vinyl/Classic/Soft/Minimal full-screen customizer, and native browser Picture-in-Picture (`P`). |
| ⏰ | **Sleep Timer with Gentle Fade** | Presets (`15m`, `30m`, `45m`, `1h`), end-of-track mode, or custom timer with a smooth 20-second volume fade-out. |
| 🔒 | **Edge Proxy & Rate Limiting** | Multi-layer sliding-window per-IP rate limiting across Vercel Edge, Cloudflare Workers & Vite local proxy, plus client token-bucket + `429` backoff. |
| 📱 | **All-Screen Responsive & 60/120fps Motion** | Adaptive layout for small phones (`<=420px`), landscape mode, tablets, and ultrawide screens with GPU-composited `transform`/`opacity` animations and hidden scrollbars. |

<details>
<summary><strong>📜 View Detailed Implementation Log (Latest Milestones)</strong></summary>

<br/>

| # | Feature | Date & Time | Summary |
|---|---|---|---|
| **1.** | 🔵🔋 **Bluetooth Device Detection, Battery Popup & AVRCP Controls (`dacAudio.ts`, `DacDetectedToast.tsx`, `player.ts`, `SettingsPage.tsx`)** | Nov 28, 2026 • 21:15 IST | Added Bluetooth headset/speaker detection (`AirPods`, `Sony`, `Bose`, `JBL`, `boAt`, etc.), **Pair Bluetooth** with BLE GATT Battery % & Manufacturer readout, theme-matched connect popups, and full MediaSession AVRCP hardware controls (`Play/Pause`, `Next`, `Prev`, `Stop`, `Seek`). |
| **2.** | 📶😄 **Slow & Offline Network Joke Popups + Chime (`slowNetwork.ts`, `SlowNetworkToast.tsx`)** | Nov 28, 2026 • 20:54 IST | Added strict slow-network (`2G`/`< 0.45 Mbps`/`> 1400ms` RTT/`>= 7.5s` buffering, 3-min cooldown) and offline (`window.offline`) monitors with random non-repeating Hinglish jokes and a soft two-tone Web Audio chime. |
| **3.** | 🎚️⏱️ **1–2s Auto-Crossfade & Premature Stream Cutoff Recovery (`player.ts`, `engine.ts`)** | Nov 28, 2026 • 20:30 IST | Enabled 2-second end-of-song auto-crossfade by default (`CROSSFADE_CHOICES` + `maybeCrossfade` `0.4s..2.0s` window), prevented 30s previews from overriding full YouTube IFrame streams, and added automatic mid-song stream-drop resume from `currentTime`. |
| **4.** | 🎤🌐 **Non-Overlapping Lyrics Toolbar, EN/Hinglish Translation & Keyless Providers (`LyricsPanel.tsx`, `translate.ts`, `providers.ts`)** | Nov 28, 2026 • 20:25 IST | Moved lyrics controls into a fixed non-overlapping `shrink-0` header above the masked scroller, limited translation to **English** & **Hinglish** (`dt=rm` + Devanagari fallback + 1:1 line alignment), and added keyless fallbacks for `PaxSenix: Spotify` & `PaxSenix: Musixmatch`. |
| **5.** | 📱🎧 **Cross-Platform DAC Auto-Detection & Theme-Matched Toast (`dacAudio.ts`, `DacDetectedToast.tsx`, `AppShell.tsx`)** | Nov 28, 2026 • 19:57 IST | Added boot-time DAC detection across phones, tablets, and computers (`devicechange`, `focus`/`visibilitychange`, WebUSB), fixed `AbortError` on idle `<audio>` elements, locked fixed signature palettes per UI style, and added theme-adaptive DAC popups. |
| **6.** | 🧭⏰ **Adaptive Time-of-Day Habit & Session Momentum Engine (`tasteProfile.ts`, `homeRecommendations.ts`)** | Nov 28, 2026 • 19:30 IST | Added per-time-slot habit tracking (`morning`, `afternoon`, `evening`, `late_night`) and live 8-track session momentum to `computeTasteProfile()` and `scoreCandidate()`. |
| **7.** | 🎧 **Universal USB DAC & Hi-Res Output** | Nov 28, 2026 • 19:22 IST | Universal DAC detection (`AB13X`, `CX31993`, `FiiO`, `iFi`, `Topping`, `Chord`, `Focusrite`, etc.), `setSinkId` on `AudioContext` + active elements, OS Picker, hot-plug auto-switch, DAC Direct Mode, Unity Volume Lock & `44.1–192 kHz`. |
| **2.** | 🎯🧠 **Multi-Signal Precision Music Taste Engine (`tasteProfile.ts`, `player.ts`, `localLibrary.ts`, `homeRecommendations.ts`, `genreRadio.ts`)** | Nov 28, 2026 • 18:37 IST | Built a behavioral taste recognition engine (`isopod:taste-signals`) tracking play counts, natural completions (`>= 72%`), early-skip penalties (`< 35%`), favorites, playlists, and 14-day recency decay; added `scoreCandidate()` precision ranking across **Your Sound**, **More From {Top Artist}**, **On Repeat**, and same-genre Auto-Play radio queues while suppressing repeatedly skipped tracks. |
| **3.** | 🧠🔁 **Cyclic Repeated-Song & Genre-Matched Recommendation Engine (`localLibrary.ts`, `homeRecommendations.ts`, `genreRadio.ts`)** | Nov 28, 2026 • 18:24 IST | Added persistent play-count tracking (`isopod:play-stats`), `getTopRepeatedTracks()`, and round-robin `nextCyclicSeedTrack()` in `localLibrary.ts`; upgraded `homeRecommendations.ts` with **On Repeat • Your Heavy Rotation**, cyclic artist mixes, and live genre-matched shelves; and enhanced `genreRadio.ts` to skip invalid external radio lookups while cyclically weaving repeated favorites into same-genre Auto-Play queues. |
| **4.** | 🎶⏱️ **Full-Length Track Resolution & Mid-Song Cutoff Fix (`externalSources.ts`, `engine.ts`, `player.ts`)** | Nov 28, 2026 • 18:20 IST | Fixed 30s short-clip playback and mid-song cutoffs: filtered `< 45s` snippets from Audius feeds, added `resolveFullLengthYouTubeMatch()` in `externalSources.ts` + `engine.ts` to upgrade `itunes:` chart tracks to full-length YouTube Music streams before falling back to 30s previews, and tightened `player.ts` Tier 3 trailing-silence auto-skip (`> 85%` duration, `>= 6s` true silence, `readyState >= HAVE_FUTURE_DATA`) so quiet bridges never cut off songs early. |
| **5.** | 🎞️⚡ **60/120fps GPU-Composited Animation Refinement (`global.css`)** | Nov 28, 2026 • 18:13 IST | Refined all core app animations (`artwork-pulse`, `spring-popup`, `menu-in`, `slide-in`, `zoom`, `enter`, `bento-reveal`, `lcd-lyric-in`, `retro-lcd-boot`) to use GPU-composited `translate3d()` + `opacity` exclusively, removing expensive per-frame `filter: blur()`/`brightness()` repaints for silky-smooth 60/120fps motion across all devices. |
| **6.** | 🎨💎 **Fixed Mass-Appealing Colour Schemes Across All 6 UI Modes (`global.css`, `ui.ts`, `SettingsPage.tsx`, `ThemeModal.tsx`)** | Nov 28, 2026 • 18:03 IST | Locked every UI mode to a cohesive, mass-appealing fixed colour scheme (**Glassmorphism**: Obsidian & Crimson `#FA243C`; **Neo-Brutalism**: Electric Cobalt `#2563EB`, Cream & Volt `#FFE600`; **Editorial Magazine**: Ivory, Ink & Vogue Crimson `#DC2626`; **Bento Grids**: Ceramic White, Apple Blue `#0066CC` & Emerald `#34C759`; **Retro iPod**: Brushed Silver & Aqua `#146EF5`; **Anime Studio**: Midnight Indigo, Sakura `#FF3E8A` & Cyber Cyan `#00D2FF`) with swatch previews in `ThemeModal` and `SettingsPage`. |
| **7.** | 🔊✨ **6 Special Theme-Matched Startup Sound Effects (`StartupScreen.tsx`)** | Nov 28, 2026 • 17:59 IST | Upgraded `playStartupSound(uiMode)` with 6 bespoke Web Audio sound signatures: **Glassmorphism** (cinema sub-drop + orchestral brass), **Neo-Brutalism** (`808` punch + staccato acid-sawtooth riff), **Editorial Magazine** (typewriter keystrokes + carriage-return bell + `Gmaj9` Rhodes), **Bento Grids** (marimba tap + `Cmaj9` pad swell), **Retro iPod** (accelerating click-wheel ticks + `C5 -> G5` Aqua chime), and **Anime Studio** (air-whoosh + J-Pop sparkle fanfare). |
| **8.** | ✨🎤 **Theme-Matched Lyrics Window Animations (`LyricsPanel.tsx`)** | Nov 28, 2026 • 17:56 IST | Added dynamic Shadow DOM lyric animations (`lyricAnimationsForUi(uiMode)`) inside `LyricsPanel.tsx` for all 6 themes (with `prefers-reduced-motion` support): luminous frosted glow (**Glassmorphism**), snappy left-rule pop (**Neo-Brutalism**), crimson broadsheet slide (**Editorial Magazine**), rounded Apple Blue pill highlight (**Bento Grids**), Aqua LCD highlight bar (**Retro iPod**), and Sakura-to-Cyan neon glow (**Anime Studio**). |
| **9.** | 🔤🎭 **Theme-Matched App-Wide Typography (`global.css`, `index.html`, `LyricsPanel.tsx`)** | Nov 28, 2026 • 17:54 IST | Mapped `--font-family` and display headings across all 6 UI modes so every page, sidebar item, track title, button, modal, and lyrics panel switches typography with the theme: **Glassmorphism** (`SF Pro Display`), **Neo-Brutalism** (`Space Grotesk`), **Editorial Magazine** (`Playfair Display` + `Georgia`), **Bento Grids** (`SF Pro Display` / Apple sans), **Retro iPod** (`Lucida Grande` / `Trebuchet MS`), and **Anime Studio** (`M PLUS Rounded 1c`). |
| **10.** | ⚡🧠 **Component-Level React Memoization & Canvas Battery Optimization (`Artwork.tsx`, `Lockups.tsx`, `ShelfView.tsx`, `AudioVisualizer.tsx`)** | Nov 28, 2026 • 17:30 IST | Wrapped hot UI components (`Artwork`, `VideoLockup`, `CircleLockup`, `TrackLockup`, `ShelfView`, `Shelves`, `TrackShelf`) in `React.memo`, added `useEffect` retry-timer cleanup in `Artwork.tsx`, deduplicated `ShelfScroller` edge state updates, and paused `AudioVisualizer` `requestAnimationFrame` loops when `document.hidden` is true. |
| **11.** | 🎨🖥️ **6 Distinct Theme-Transformed Full-Screen Player Designs (`FullScreenPlayer.tsx`)** | Nov 28, 2026 • 17:25 IST | Updated `FullScreenPlayer.tsx` to read `uiMode` dynamically and render 6 unmistakable player designs when switching themes: frosted glass card (**Glassmorphism**), raw Dual-Tone poster card (**Neo-Brutalism**), `Playfair Display` + crimson kicker broadsheet (**Editorial Magazine**), rounded Apple Blue tile (**Bento Grids**), Aqua-header backlit LCD hardware (**Retro iPod**), and Sakura-to-Violet cel-shaded manga stage (**Anime Studio**). |
| **12.** | 🎞️🎛️ **Smooth View Transitions & Theme-Matched MiniPlayer/PlayerBar Polish (`PrefetchLink.tsx`, `MiniPlayer.tsx`, `global.css`)** | Nov 28, 2026 • 17:21 IST | Added native View Transitions API route transitions (`viewTransition` on `PrefetchLink` / `PrefetchNavLink` with `page-stage` crossfade/rise & `prefers-reduced-motion` guard) and tailored `PlayerBar` (`.glass-pill`) + floating `MiniPlayer` (`[data-mini-player]`) styling across all 6 UI modes. |
| **13.** | 🏠🚫 **Hide Recently Played Shelf on Home Screen (`HomePage.tsx`)** | Nov 28, 2026 • 17:12 IST | Removed the `Recently Played` shelf from `HomePage.tsx` (filtering out YouTube's `Recently Played` shelf as well) while keeping recent history in **Library** and using it behind the scenes for personalized Home recommendations. |
| **14.** | 🎛️🔊 **Cross-Device 10-Band EQ & Bass Boost Fix (`equalizer.ts`, `EqualizerModal.tsx`)** | Nov 28, 2026 • 17:06 IST | Fixed EQ not taking effect across devices: eliminated parallel double-routing between `eqMasterGain` and AutoMix `Deck` inside `attachEqualizerToContext()`, added `AudioContext` `statechange` + `resume()` gain re-sync so suspended contexts never drop EQ gains, and added `touch-none` + `onInput` + wider touch targets on vertical band sliders for iOS/Android/Desktop. |
| **15.** | 🎭✨ **Grand All-Theme Startup Screens & Full-Component Theme Styling (`StartupScreen.tsx`, `global.css`)** | Nov 28, 2026 • 15:01 IST | Upgraded all 6 startup screens to grand cinematic intros (manga speed-lines & sakura particles for **Anime Studio**, studio spotlight & animated Aqua progress for **Retro iPod**, 6-tile Apple keynote showcase for **Bento Grids**, collector's broadsheet cover for **Editorial Magazine**, dual counter-marquees for **Neo-Brutalism**, and Netflix-style ribbons for **Glassmorphism**), and styled every UI component (sidebar, modals, dialogs, menus, inputs, selects) to match the active theme. |
| **16.** | 🎨🪟 **Theme-Stylized App UI Look Window & Fixed Colour Schemes (`SettingsPage.tsx`, `ui.ts`)** | Nov 28, 2026 • 14:53 IST | Stylized the **App UI Look** settings window, mode pills, and `Switch UI Style` button to match the active theme (**Glassmorphism**, **Neo-Brutalism**, **Editorial Magazine**, **Bento Grids**, **Retro iPod**, **Anime Studio**), displayed each theme's fixed signature colour scheme swatches, and scoped the Neo-Brutalism Dual-Tone color picker to Neo-Brutalism mode. |
| **17.** | 🔊🛠️ **Reliable Startup Boot Chime Audio Unlock (`StartupScreen.tsx`)** | Nov 28, 2026 • 14:50 IST | Fixed intermittent missing startup boot chimes caused by `AudioContext` `resume()` race conditions and `{ once: true }` gesture listeners: added `statechange` listeners, persistent `pointerdown`/`touchstart`/`click`/`keydown` unlock until `played === true`, and `unlock()` guard inside `handleBackdropClick` so tapping to skip never kills an in-flight chime. |
| **18.** | 🌸⚡ **6th UI Style: Anime Studio (`global.css`, `StartupScreen.tsx`, `LyricsPanel.tsx`)** | Nov 28, 2026 • 14:44 IST | Added the 6th full-app UI style (`anime`: **Anime Studio**) with Sakura Pink & Cyber Cyan cel-shaded manga panel cards across Home & all pages, `M PLUS Rounded 1c` rounded display & lyrics typography, Dark/AMOLED & Landscape mode support, and an Anime Title-Card `StartupScreen.tsx` with floating sakura petals & ascending pentatonic sparkle chime. |
| **19.** | 🎛️🎧 **5th UI Style: Retro iPod / Skeuomorphic Hardware (`global.css`, `StartupScreen.tsx`, `LyricsPanel.tsx`)** | Nov 28, 2026 • 14:36 IST | Added the 5th full-app UI style (`retro`: **Retro iPod**) with brushed-aluminum metallic surfaces, recessed backlit LCD shelves & Full-Screen Player, Aqua blue selection highlights, Lucida/Trebuchet LCD lyrics font, Dark/AMOLED & Landscape mode support, and a Skeuomorphic iPod Classic `StartupScreen.tsx` with click-wheel ticks + warm `F#` boot chime. |
| **20.** | 📱🔄 **Landscape Mode Optimization Across All 4 UI Themes (`tokens.css`, `global.css`)** | Nov 28, 2026 • 00:29 IST | Added `@media (orientation: landscape) and (max-height: 580px)` layout & theme optimizations across **Glassmorphism**, **Neo-Brutalism**, **Editorial Magazine**, and **Bento Grids**: compact sidebar item height, slimmer floating PlayerBar, clamped Full-Screen Player artwork (`--art: clamp(104px, 32dvh, 184px)`), and tighter shelf/card padding & shadows for short landscape screens, verified with `uiThemes.test.tsx`. |
| **21.** | 🧼📜 **Global Hidden Scrollbars (`global.css`, `AppShell.tsx`, `UpNext.tsx`)** | Nov 28, 2026 • 00:22 IST | Hid visual scrollbars across the entire app (`scrollbar-width: none`, `-ms-overflow-style: none`, `*::-webkit-scrollbar { display: none }`) and removed `[scrollbar-gutter:stable]` from `#scrollable-page`, keeping wheel, touch, and keyboard scrolling completely functional without visible scrollbar tracks. |
| **22.** | ⚡📦 **Bundle Code-Splitting, Lazy Modals & Scroll Paint Optimization** | Nov 28, 2026 • 00:19 IST | Optimized `vite.config.ts` (`es2022` target + Rolldown `manualChunks` splitting `vendor-react`, `vendor-state`, `vendor-icons`, and `vendor-youtube`), lazy-loaded on-demand modals (`EqualizerModal`, `SleepTimerModal`, `ThemeModal`, `UiRestartDialog`) in `AppShell.tsx`, and added `content-visibility: auto` on `#scrollable-page section` in `global.css` to skip off-screen shelf layout/paint. |
| **23.** | 💾⏯️ **Retained Last Played Songs & Playhead on Restart (`player.ts`, `HomePage.tsx`)** | Nov 28, 2026 • 00:16 IST | Hardened playback session & recent-history retention across app restarts: preserved `resumeState` playhead in `getPlayhead()`, `persistPlaybackSession()`, and unloaded-audio `togglePlay()` resumes, and merged persisted `localLibrary.recentTracks` into `HomePage.tsx` `useRecentlyPlayed()` so Home & Library retain last played songs even offline or without YouTube sign-in. |
| **24.** | ⏭️▶️ **YouTube Music-Only Auto-Skip Intros (`introOutroSkip.ts`, `player.ts`)** | Nov 28, 2026 • 00:11 IST | Restricted `prepareIntroOutroSkip()` and `maybeSkipIntroOutro()` using `isYouTubeMusicSource(videoId, client)` so SponsorBlock, synced-lyric intro/outro detection, and trailing silence auto-skip run **only** for YouTube Music tracks and streams—leaving Audius, iTunes, Spotify, addon, and local tracks untouched. |
| **25.** | 🔊🎭 **4 Theme-Matched Startup Sound Engines (`StartupScreen.tsx`)** | Nov 28, 2026 • 00:04 IST | Upgraded `playStartupSound(uiMode)` with 4 custom-synthesized Web Audio signatures matched to each UI style: **Glassmorphism** (Cinema `"Ta-Dum"` + orchestral brass swell), **Neo-Brutalism** (square sub-stomp + gritty sawtooth power chord), **Editorial Magazine** (mechanical typewriter clicks + warm Rhodes `Fmaj9` chord), and **Bento Grids** (Apple-inspired crystalline `Cmaj9` chime arpeggio). |
| **26.** | 🪟✨ **Primary UI: Frosted Glassmorphism Upgrade** | Nov 27, 2026 • 23:59 IST | Enhanced **Primary UI** (`[data-ui-mode="primary"]` in `global.css`) into a full **Apple-Grade Glassmorphism** system: added ambient multi-color radial aura behind `#scrollable-page`, `24px–28px` saturated backdrop blur on `.glass-material`, `.glass-pill`, modals, and frosted translucent glass cards with `1px` luminous inner highlights across shelves and settings. |
| **27.** | 🎵💬 **Single-Line Live Lyrics in PlayerBar LCD** | Nov 27, 2026 • 23:55 IST | Added `useLiveLyricLine()` in `Lcd.tsx` (sharing the `useLyrics()` cache + `parseTtml`) to display the active synced lyric line right inside the floating PlayerBar subtitle with a subtle rising fade animation (`lcd-lyric-in` in `global.css`), seamlessly falling back to artist credits during instrumental gaps or unsynced tracks. |
| **28.** | 🎨🎤 **Theme-Adaptive Full-Screen Player & Lyrics Typography** | Nov 27, 2026 • 23:52 IST | Updated `FullScreenPlayer.tsx` (`MeshBackdrop` + `--keyColor` theme-tint wash) and `LyricsPanel.tsx` Shadow DOM (`am-lyrics`) so both the Full-Screen Player screen and lyrics font/highlight colors (`Playfair Display` serif in Editorial, geometric sans in Neo-Brutalism, Apple sans in Bento, SF Pro in Primary) adapt dynamically to the active UI style, palette, and Dark/Light theme. |
| **29.** | 🧩🍏 **4th UI Style: Apple-Inspired Bento Grids** | Nov 27, 2026 • 23:46 IST | Added the 4th full-app UI style (`bento`: **Bento Grids**) with Apple-style `#F5F5F7`/`#FFFFFF`/`#1D1D1F`/`#007AFF`/`#34C759` modular rounded tiles (`1.5rem`), Dark/AMOLED mode contrast, soft elevation & `scale(1.02)` hover lift, staggered `bento-reveal` animations, and a 4-tile modular Bento grid `StartupScreen.tsx` showcase. |
| **30.** | 📰✒️ **3rd UI Style: Editorial Grid / Magazine** | Nov 27, 2026 • 23:42 IST | Added the 3rd full-app UI style (`editorial`: **Editorial Magazine**) with Playfair Display serif display headlines, `#000000`/`#FFFFFF`/`#DC2626`/`#6B7280` print palette + Dark/AMOLED compatibility, `2px` section top rules, crimson active nav accents, scroll-driven rising headlines (`editorial-rise`), and a print-cover `StartupScreen.tsx` masthead animation (`editorial-rule`). |
| **31.** | 💾🎶 **Unlimited Persistent Imported Playlists (IndexedDB)** | Nov 27, 2026 • 23:39 IST | Upgraded `localLibrary.ts` to store imported playlists, favorites, and recent tracks in **IndexedDB** (`isopod-library` via `idb`) alongside a `localStorage` fallback & legacy `bitchord:local-library` migration—preventing large imported playlists from hitting the 5 MB `localStorage` quota and disappearing after app restarts. |
| **32.** | 🎬🟨 **Dual-Style Startup Screen & Animations (`StartupScreen.tsx`)** | Nov 27, 2026 • 23:33 IST | `StartupScreen.tsx` now adapts to the active UI style: **Primary UI** plays the fluid Netflix-style multi-color ribbon & zoom splash (`netflix-ribbon`, `netflix-zoom`, `startup-sheen`), while **Secondary UI** launches a distinct **Neo-Brutalism Dual-Tone** splash with a scrolling top marquee (`brutal-marquee`), hard-slam poster card (`brutal-slam`), snap-rotated badge (`brutal-badge-pop`), and stepped dual-tone stomp bars (`brutal-bar-stomp`). |
| **33.** | 🏠✨ **Multi-Source Home Recommendations (Audius + iTunes + YTM)** | Nov 27, 2026 • 23:30 IST | Upgraded `HomePage.tsx` with `homeRecommendations.ts` + `externalSources.ts` (`fetchAudiusTrendingTracks`, `fetchItunesChartTracks`): surfaces personalized *"Because You Listened to …"* mixes, **Trending on Audius** (320kbps direct Hi-Fi), **Top Charts • India & Global** (Apple iTunes RSS), and time-of-day vibe shelves alongside YouTube Music—and keeps Home rich & playable even without the browser extension. |
| **34.** | 🟨⬛ **Secondary UI: Neo-Brutalism Dual-Tone System** | Nov 27, 2026 • 23:21 IST | Designed the full **Secondary UI** (`[data-ui-mode="secondary"]` in `global.css`) in **Neo-Brutalism** style across the main shell, Settings, Full-Screen Player (`[data-full-screen]` + Lyrics), and Dark/AMOLED modes: flat poster surfaces, `2px–3px` solid ink borders, hard offset shadows (`3px–7px`), auto dark/AMOLED ink & surface contrast, 5 curated Dual-Tone palettes (`Acid & Ink`, `Cobalt & Volt`, `Poster Red`, `Tangerine Dark`, `Mint Obsidian`), and custom `Tone 1` / `Tone 2` color pickers. |
| **35.** | 🎭🔄 **App UI Look Switcher & Restart Confirmation Flow** | Nov 27, 2026 • 23:06 IST | Added full-app `uiMode` (`primary` / `secondary`, persisted in `isopod:ui-mode` + pre-paint `data-ui-mode` in `index.html`), exposed the **App UI Look** switcher in `ThemeModal.tsx` and `SettingsPage.tsx`, and built `UiRestartDialog.tsx` to prompt user confirmation (`Cancel` / `Restart & Apply`) before restarting the app via `window.location.reload()`. |
| **36.** | 🔊✨ **Startup Sound Autoplay Unlock & Full Tail** | Nov 27, 2026 • 22:44 IST | Fixed `StartupScreen.tsx` Web Audio startup sound being cut short on unmount or silently blocked by browser autoplay policy: preserved the 2.45s `AudioContext` tail across splash exit so the orchestral chord rings out completely, and added a `"Tap anywhere for Cinema Sound"` prompt when the browser suspends audio before a gesture. |
| **37.** | 🎧🌙 **Background Playback & Lock-Screen Keep-Alive** | Nov 27, 2026 • 22:35 IST | Added `backgroundAudio.ts` with a silent 1s 8-bit PCM WAV loop (`volume: 0.001`, `playsinline`) to keep iOS/Android OS audio sessions & `MediaSession` lock-screen controls alive across track-switch gaps and YouTube IFrame playback; added `visibilitychange`/`pageshow`/`focus` `AudioContext` + playback auto-resume in `player.ts`; and added automatic background resume in `IframePlayerAdapter.ts` when browsers auto-pause hidden iframes. |
| **38.** | 💿🔄 **Vinyl Mode Spin & Spindle Fix** | Nov 27, 2026 • 10:24 IST | Fixed `FullScreenPlayer.tsx` vinyl mode not spinning when Apple `MotionArtwork` overlaid the static `<img>`: wrapped both artwork and `MotionArtwork` in a dedicated rotating disc container (`spin 14s linear infinite`, paused when playback pauses) and placed the vinyl center spindle at `z-10` above motion art. |
| **39.** | 🛠️📱 **Landscape PlayerBar & Customizer Popover Fix** | Nov 27, 2026 • 10:20 IST | Fixed `PlayerBar.tsx` overflow/squashed LCD on compact & phone-landscape widths (`< 1024px`) by adding `overflow-hidden` on the pill & LCD container and collapsing secondary controls (`Shuffle`, `Repeat`, `Favorite`, `TrackMenu`) into Quick Tools / Full-Screen; prevented `Sidebar.tsx` tagline wrapping; and added `max-h-[calc(100dvh-...)] overflow-y-auto` to the `FullScreenPlayer.tsx` Customizer popover so its header never clips on short screens. |
| **40.** | 📱🖥️ **All-Screen Responsive Optimization** | Nov 27, 2026 • 10:13 IST | Added responsive layout tokens in `tokens.css` for small phones (`<=420px`: `16px` gutter), tablets (`768px–1023px`: `220px` sidebar), and ultrawide monitors (`>=1600px`: fluid gutter + `340px` side panel); switched `EqualizerModal`, `ThemeModal`, and `SleepTimerModal` to `100dvh` + safe-area padding; added `touch-action: manipulation`, `overscroll-y-contain`, tighter mobile `--art` bounds in `FullScreenPlayer.tsx`, and `xl`/`2xl` grid columns in `SearchPage.tsx`. |
| **41.** | 📐💿 **Full-Screen Vinyl & Card Alignment Fix** | Nov 27, 2026 • 10:03 IST | Fixed `FullScreenPlayer.tsx` centered card overflow where `.fullscreen-art` used `w-(--art)` inside a padded `w-(--art)` container, causing the vinyl disc to touch the right edge; centered artwork with balanced `p-6 pb-5` card padding and clean visualizer bottom spacing. |
| **42.** | 🧹✨ **Complete "BitChord" → "ISO pod" App Scrub** | Nov 27, 2026 • 09:54 IST | Replaced all remaining `BitChord` / `bitchord` references across UI pages, modals, Discord/Spotify/YouTube/Extension prompts, Audius `app_name`, EQ export filenames, CSS custom properties & font family (`ISOpod SF Pro Display`), `localStorage` keys (`isopod:*`), browser extension metadata (`wxt.config.ts`), and edge proxy service labels. |
| **43.** | 🔊🎬 **Dramatic Cinema Startup Sound Engine** | Nov 27, 2026 • 09:44 IST | Upgraded `StartupScreen.tsx` Web Audio synthesizer with a dynamics compressor, cinema-hall echo tail, pre-hit filtered noise whoosh riser, dual-layer `"Ta-Dum"` sub-bass drop (`94 Hz → 38 Hz`), and a 6-voice detuned orchestral synth-brass chord swell synced with the multi-color ribbon burst. |
| **44.** | 🎨💿 **Custom ISO-POD Logo & Icon Suite** | Nov 27, 2026 • 09:42 IST | Replaced the old app logo everywhere with the new circular **ISO-POD** badge (`logo.png`), anti-aliased with transparent edges and generated across all sizes (`favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`), plus updated `LogoMark.tsx`, `index.html`, and the circular Netflix-style `StartupScreen.tsx` centerpiece. |
| **45.** | 🏷️🎧 **App Rebrand to "ISO pod" + Tagline** | Nov 27, 2026 • 09:36 IST | Rebranded all user-facing app titles, manifest (`manifest.webmanifest`), `index.html`, Netflix-style `StartupScreen.tsx`, `Sidebar.tsx`, `MobileTopBar.tsx`, and empty/status prompts to **ISO pod** with the fitting tagline **"Pure Sound. Pocket Hi-Fi."** |
| **46.** | 🛡️⏱️ **Site-Wide Proxy & Client Rate Limiter** | Nov 27, 2026 • 09:24 IST | Implemented multi-layer rate limiting across the entire site: sliding-window per-IP rate limiting (`120` API reqs/min, `240` media/range reqs/min, bounded bucket pruning, `429 Retry-After` + `X-RateLimit-*` headers) in Vercel Edge (`api/proxy.js`, `web/api/proxy.js`), Cloudflare Worker (`web/ios-proxy/worker.js`), and Vite local proxy (`vite.config.ts`), paired with a token-bucket + 429-backoff client rate limiter (`rateLimiter.ts`) integrated into search and external source APIs. |
| **47.** | 🎨💿 **Mochy-Style Full-Screen Player Customizer** | Nov 27, 2026 • 01:45 IST | Added a live inline Full-Screen Customizer (`FullScreenPlayer.tsx` + `ui.ts`) accessible via the top **Customize** pill or bottom **Sparkles** icon: switch Artwork Styles (**Classic**, spinning **Vinyl** disc with center spindle, **Soft** squircle, **Minimal**), Backdrops (**Mesh**, **Aurora**, **Frosted**, **AMOLED**), Stage Layouts (**Apple Split**, **Mochy Flip**, **Glass Card**), and Audio Visualizer visibility with instant persistence. |
| **48.** | 🎛️✨ **Customizable Player Bar Styles** | Nov 27, 2026 • 01:14 IST | Added 4 live-switchable Player Bar visual styles (`Apple Glass`, `Compact Pill`, `Studio Dock`, and `Neon Glow`) persisted in `ui.ts` (`bitchord:player-style`), selectable from both the quick Theme Customizer modal (`ThemeModal.tsx`) and `SettingsPage.tsx`, and applied dynamically across desktop `PlayerBar.tsx` and `MobilePlayerBar.tsx`. |
| **49.** | 🛡️▶️ **Resilient Multi-Tier Playback & Embed Fallback Fix** | Nov 27, 2026 • 00:00 IST | Fixed intermittent playback failures when tracks hit YouTube embed restrictions (`Error 101/150`) or bot-gates: filtered out non-YouTube IDs (`audius:` / `itunes:`) from YouTube IFrame `tryEmbed`, parallelized `searchSongs` + `searchMainVideos("${query} audio")` up to 6 embeddable fallback candidates, added Audius full-MP3 stream fallback in `YouTubeEngine.load()` catch recovery, and enabled automatic radio advance when a single unplayable track fails. |
| **50.** | 🌐🎵 **Multi-Source Built-In Song Fetching & Streaming (Audius + iTunes)** | Nov 26, 2026 • 23:39 IST | Added built-in non-YouTube music fetching and playback (`externalSources.ts`): integrates **Audius Discovery Network** (direct 320kbps MP3 full-track streaming, CORS-enabled, zero bot-gate, full 10-band EQ & visualizer support) and **Apple iTunes Search API** into `fetchSearch`, `searchSongs`, `genreRadio.ts`, and `YouTubeEngine.load()` automatic fallback—so songs search, load, and play even without YouTube or browser extensions. |
| **51.** | 🌟🚀 **Netflix-Style Multi-Color Startup Splash Screen & Sound** | Nov 26, 2026 • 23:52 IST | Upgraded `StartupScreen.tsx` with a cinematic pitch-black stage, 10 Netflix-inspired multi-color vertical spectrum light ribbons (`netflix-ribbon`), conic-gradient ambient glow, spring-scaled glass `LogoMark` badge with light-sheen sweep, multi-color gradient `"BitChord"` wordmark with `netflix-zoom` transition, 5-bar neon equalizer, synthesized Web Audio `"Ta-Dum"` sub-bass + harmonic chord startup sound effect (isolated strictly to startup), tap-to-skip, and `prefers-reduced-motion` support. |
| **52.** | ⏩🎬 **Auto-Detect & Skip Intros & End Credits** | Nov 26, 2026 • 23:26 IST | Multi-tier automatic intro, non-music skit, and end-credits skipper: Tier 1 queries SponsorBlock (`music_offtopic`, `intro`, `outro`) with segment merging and caching; Tier 2 analyzes synced lyrics vocal boundaries (`>= 20s` opening delay and `>= 18s` trailing credits); Tier 3 monitors real-time Web Audio `AnalyserNode` silence tails (`>= 4s`) to automatically advance to the next track; plus user toggle in Settings and manual-seek re-watch protection. |
| **53.** | ⏭️⏮️ **Next & Previous Transport Buttons Fix** | Nov 26, 2026 • 20:05 IST | Resolved non-functional Next and Previous track controls across PlayerBar, FullScreenPlayer, MiniPlayer, and MobilePlayerBar: eliminated artificial `!hasNext` button disabling so transport is always active; wired hardware `unlockAudioOnGesture()` to both buttons to prevent browser audio context drops; enhanced `previous()` with double-tap (<2s) and beginning-of-track detection to instantly jump to previous tracks instead of perpetually seeking to 0; and strengthened `advance()` with auto-looping, same-genre radio refill, and automatic skipping of unplayable tracks. |
| **54.** | 📻🎶 **Intelligent Same-Genre Auto-Loading Radio Engine** | Nov 26, 2026 • 19:55 IST | Automatically detects the musical genre and acoustic vibe of any currently playing song (via iTunes Search API with fallback heuristic taxonomy across Bollywood, Punjabi, Dance/EDM, Rock, Pop, Hip-Hop, Lo-Fi, etc.), auto-loads a continuous Up Next queue of same-genre tracks with multi-tier fallback (YouTube Music Radio -> YTM Songs shelf -> YouTube Video Search), dynamically refills the queue when low (<= 2 tracks), and eliminates stalled or abrupt playback endings. |
| **55.** | 🔊🔇 **Volume Slider & Mute Toggle Bridge Fix** | Nov 26, 2026 • 19:40 IST | Fixed master volume slider and mute speaker button by keeping `deck.audio.volume` and `deck.audio.muted` synchronized across both IframePlayerAdapter (YouTube Iframe embed bridge) and native HTMLMediaElement outputs alongside Web Audio `eqMasterGain`, added continuous real-time `onInput` dragging, added `stopPropagation` on mute button taps, and auto-restored 50% volume when unmuting from 0%. |
| **56.** | ⚡🔊 **Studio Equalizer Live DSP Routing Engine Fix** | Nov 26, 2026 • 19:35 IST | Decoupled 10-Band Equalizer from the heavy Automix DJ scheduler into a dedicated Web Audio DSP pipeline; attached deck HTMLAudioElements directly via cached MediaElementAudioSourceNodes; wired hardware gesture AudioContext automatic resume across all gestures, slider adjustments, and preset clicks; routed master and deck fader volumes cleanly through eqMasterGain; and restored live real-time audible acoustic processing with visual pulsing DSP indicators. |
| **57.** | 🎚️ **10-Band Studio Sound Equalizer with Custom Preset Import/Export** | Nov 26, 2026 • 19:05 IST | Upgraded from 5 to 10 ISO octave frequency bands (32 Hz to 16 kHz), added 14 popular studio genre presets (Bass Boost, Bass Reducer, Vocal Booster, Treble Booster, EDM, Rock, Hip-Hop, Pop, Acoustic, Classical, Jazz, Deep Lounge, Dialogue), wired real-time Web Audio biquad filter chain directly into playback, and added full custom preset management with JSON import/export and 5-to-10 band interpolation. |
| **58.** | ✨ **Apple-Grade Micro-Animations & Motion Polish** | Nov 26, 2026 • 18:55 IST | Hardware-accelerated dynamic artwork radiosity breathing bloom (`4.5s` pulse during playback), spring modal popups (`cubic-bezier(0.16, 1, 0.3, 1)`), tactile spring physics on transport controls (`hover:scale-108 active:scale-92`), and accent-color reactive audio visualizer with illuminated white tips. |
| **59.** | ⚡ **Lyrics Animation Polish & Zero-Delay Sync Engine** | Nov 26, 2026 • 18:51 IST | Removed awkward line bobbing/wobble and character jitter; introduced rock-solid Apple Music typography, clean opacity hierarchy (no greasy blur), and crystal-clear ambient radiosity glow. Accelerated clock slew rate (`CORRECTION_MS = 150`, `MAX_SLEW = 0.75`), added +220ms lead-in compensation to eliminate hardware audio buffer delay, and integrated custom sync offset slider (-200ms to +600ms) in Lyric Settings. |
| **60.** | 🎛️ **PlayerBar & Landscape Responsive Layout** | Nov 26, 2026 • 18:45 IST | Glass-pill dynamic responsive expansion (up to 840px), intelligent Quick Tools contextual popover (`SlidersHorizontal`), auto-collapsing utility buttons when side panels open, preventing UI truncation and LCD title squashing across all screen sizes. |
| **61.** | 🎤 **Fluid Apple Music Lyric Animations** | Nov 26, 2026 • 18:37 IST | Spring-driven active line entrance elevation (`scale(1.045)`), dynamic breathing radiosity karaoke glow with key-color ambient bloom, 3D progressive depth-of-field blur on inactive lines, syllable karaoke pop, tactile seek hover highlights, and dancing instrumental gap dots. |
| **62.** | 📱 **Landscape Mode Formatting Overhaul** | Nov 26, 2026 • 18:32 IST | Redesigned FullScreenPlayer layout for landscape and compact heights (≤620px): side-by-side artwork + metadata header row, isolated z-20 bottom action bar eliminating control collisions, compact scrubber, 38px transport, and auto-scaled 22px visualizer. |
| **63.** | 🖤 **Pure AMOLED Pitch Black Mode** | Nov 26, 2026 • 18:24 IST | True `#000000` pitch-black dark theme for zero-power display efficiency on OLED/AMOLED screens, deep contrast, and true-black shelves and sidebars. |
| **64.** | 🎨 **Custom Accent Colors & iOS Palettes** | Nov 26, 2026 • 18:24 IST | Live HTML5 color picker and hex input for custom button/accent tinting, 10 quick vibrant color swatches, plus 9 curated iOS palettes (Neon Pink, Electric Blue, Sunset Coral, Mint, Violet, Amber, Emerald, Cyan, Crimson). |
| **65.** | 🪟 **Glassmorphism Customizer** | Nov 26, 2026 • 18:24 IST | 4-tier background blur and translucency customization: Apple Glass (32px), Ultra Frosted (48px high saturation), Subtle Glass (12px), and Solid Flat (0px blur for high performance). Accessible from Settings and quick-palette modal. |
| **66.** | ⏰ **Sleep Timer with Volume Fade-Out** | Nov 26, 2026 • 18:13 IST | Auto-timer with presets (15m, 30m, 45m, 1h), "End of current track" watcher, or custom minute input. Features gentle 20-second volume fade-out before playback automatically pauses. |
| **67.** | 🌊 **Audio Visualizer & Waveforms** | Nov 26, 2026 • 18:13 IST | Real-time audio reactive 60 FPS canvas visualizer featuring 3 switchable modes: Spectrum Frequency Bars, Layered Flowing Oscillogram Waves, and Pulsing Particles. Powered by Web Audio AnalyserNode with rhythmic beat-clock fallback. |
| **68.** | 🎚️ **5-Band Sound Equalizer & Bass Boost** | Nov 26, 2026 • 18:13 IST | Precision 5-band biquad filter graphic EQ (60 Hz, 230 Hz, 910 Hz, 3.6 kHz, 14 kHz), 9 genre presets (Rock, Pop, Electronic, Vocal, Acoustic, Flat, etc.), live interactive SVG frequency response curve, and dedicated +12dB punchy Sub-Bass Booster. |
| **69.** | 🖼️ **Floating Mini-Player & PiP** | Nov 26, 2026 • 18:13 IST | Draggable floating glass player card with position persistence across page navigation, artwork expander, full playback scrubbers/controls, and native browser Picture-in-Picture (`video.requestPictureInPicture`). Quick shortcut: `P`. |

</details>

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
- **6 Theme-Matched Startup Splashes & Sound Engines (`StartupScreen.tsx`)**:
  - **Glassmorphism**: GPU-composited spectrum ribbons (`netflix-ribbon`), conic glow, sonar rings, diagonal light-sheen sweep, and a cinema sub-drop + orchestral brass swell.
  - **Neo-Brutalism**: Scrolling dual-tone marquee (`brutal-marquee`), hard-slam poster card, stepped stomp bars, and an `808` punch + staccato acid-sawtooth riff.
  - **Editorial Magazine**: Masthead rule (`editorial-rule`), Playfair Display serif cover, typewriter keystrokes + bell, and a warm `Gmaj9` Rhodes chord.
  - **Bento Grids**: 6-tile modular Apple-style keynote showcase (`bento-reveal`) with a marimba tap + `Cmaj9` pad swell.
  - **Retro iPod**: Brushed-aluminum iPod Classic splash with accelerating click-wheel ticks + `C5 -> G5` Aqua boot chime.
  - **Anime Studio**: Manga speed-lines & sakura petal particles with an air-whoosh + J-Pop sparkle fanfare — all supporting `prefers-reduced-motion` and tap-to-skip.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=6,11,20&height=4&animation=fadeIn" width="100%" alt="Animated Gradient Divider" />
</div>

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
# Run all tests (32 test files, 224 tests)
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
