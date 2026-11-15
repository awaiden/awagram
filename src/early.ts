import {
  ROOT_ID,
  dismissSplashIfReady,
  ensureNavbarSettingsButton,
  injectStyleAndSync,
  loadPrefs,
  redirectHomeIfReels,
  savePrefs,
  scanDom,
  setupShakeToOpen,
  setupSpaProtection,
  showSplashScreen,
  syncHtmlClasses,
  type LitePrefs,
} from "./core";

declare global {
  interface Window {
    __IG_LITE_INITIALIZED__?: boolean;
    __IG_LITE_PREFS__?: LitePrefs;
    __IG_LITE_ON_PREFS_CHANGE__?: (next: LitePrefs) => void;
    __IG_LITE_LOAD_UI__?: () => void;
  }
}

(() => {
  if (typeof window === "undefined" || window.top !== window.self) {
    return;
  }
  if (window.__IG_LITE_INITIALIZED__) {
    return;
  }
  window.__IG_LITE_INITIALIZED__ = true;

  let currentPrefs = loadPrefs();
  window.__IG_LITE_PREFS__ = currentPrefs;
  window.__IG_LITE_ON_PREFS_CHANGE__ = (next: LitePrefs) => {
    currentPrefs = next;
    window.__IG_LITE_PREFS__ = next;
    savePrefs(next);
    syncHtmlClasses(next);
    if (next.hideReels) {
      redirectHomeIfReels(next);
    }
  };

  let uiLoaded = false;
  function tryMountUi(): void {
    if (uiLoaded) return;
    if (!document.head || !document.body) return;
    if (document.getElementById(ROOT_ID)) {
      uiLoaded = true;
      return;
    }
    if (typeof window.__IG_LITE_LOAD_UI__ === "function") {
      uiLoaded = true;
      try {
        window.__IG_LITE_LOAD_UI__();
      } catch (err) {
        uiLoaded = false;
        console.error("[ig-lite] UI mount failed:", err);
      }
    }
  }

  let rafScheduled = false;
  function scheduleScan(): void {
    if (rafScheduled) return;
    rafScheduled = true;
    const run = () => {
      rafScheduled = false;
      scanDom();
      ensureNavbarSettingsButton();
      tryMountUi();
      dismissSplashIfReady();
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(run);
    } else {
      setTimeout(run, 16);
    }
  }

  function startDomObserver(): void {
    const target = document.documentElement || document;
    if (!target || typeof MutationObserver !== "function") return;

    const observer = new MutationObserver(() => {
      injectStyleAndSync(currentPrefs);
      scheduleScan();
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  setupSpaProtection(() => currentPrefs);
  setupShakeToOpen();

  if (injectStyleAndSync(currentPrefs)) {
    showSplashScreen();
    window.setTimeout(() => dismissSplashIfReady(true), 3000);
    startDomObserver();
    if (document.readyState !== "loading") {
      scanDom();
      tryMountUi();
      dismissSplashIfReady();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        scanDom();
        tryMountUi();
        dismissSplashIfReady();
      });
    }
  } else if (typeof MutationObserver === "function") {
    const bootstrapObserver = new MutationObserver(() => {
      if (injectStyleAndSync(currentPrefs)) {
        bootstrapObserver.disconnect();
        showSplashScreen();
        window.setTimeout(() => dismissSplashIfReady(true), 3000);
        startDomObserver();
        scanDom();
        tryMountUi();
        dismissSplashIfReady();
      }
    });
    bootstrapObserver.observe(document, { childList: true, subtree: true });
  }
})();
