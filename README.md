# awagram

A minimalist, distraction-free Instagram WebView wrapper for Desktop and Android built with **Tauri v2**, **Rust**, **React**, and **TypeScript**.

## Features

- **Custom Splash Screen & Icon**: Instant `awagram` dark splash screen while Instagram loads.
- **Block Reels**: Dims the Reels navigation icon with a `BLOCKED` badge, disables clicks without reloading, hides feed Reels carousels, and redirects `/reels` routes to `/`.
- **Hide Explore (Search Preserved)**: Hides the Explore discovery grid and shows an *"Explore is hidden"* placeholder while keeping the Search bar and search results fully usable.
- **Hide Suggested & Block Ads**: Filters *"Suggested for you"* / *"Senin için önerilenler"* and *"Sponsored"* / *"Sponsorlu"* / *"Paid partnership"* posts.
- **Hide "Use the App" Banners**: Automatically hides mobile WebView app-download prompts.
- **Optional Focus Toggles**: Hide Stories tray and Direct Messages icon/badges.
- **Settings Drawer (Bottom Sheet)**: Accessible via the custom `awagram` icon on the home navbar, by shaking the phone (`devicemotion`), or via `Ctrl+Shift+L` / `Cmd+Shift+L`.
- **Not Following Back Analyzer**: Fetches following/followers via Instagram Web API, caches results in `localStorage`, and supports Ignore (whitelist), Unfollow, Open Profile, and CSV export.

## Requirements

- **Node.js** 20+ & **npm**
- **Rust** (`rustup`, `cargo`)
- **Android builds**: Android SDK (`platforms;android-35`, `build-tools;35.0.0`), Android NDK (`27.2.12479018`), JDK 25 (`JAVA_HOME`), and Rust Android targets (`aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`).

## Development & Build

```bash
npm install

# Run tests
npm test
cargo test --manifest-path src-tauri/Cargo.toml

# Desktop dev
npm run tauri dev

# Android APK/AAB build
npm run tauri android build
```
