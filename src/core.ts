export interface LitePrefs {
  hideReels: boolean;
  hideExplore: boolean;
  hideSuggested: boolean;
  hideAds: boolean;
  hideUseApp: boolean;
  hideStories: boolean;
  hideDms: boolean;
}

export const PREFS_KEY = "ig_lite_prefs";
export const STYLE_ID = "ig-lite-style";
export const ROOT_ID = "ig-lite-root";
export const NAV_BTN_ID = "ig-lite-nav-settings-btn";
export const OPEN_DRAWER_EVENT = "ig-lite:open-drawer";
export const SPLASH_ID = "ig-lite-splash";

export const DEFAULT_PREFS: LitePrefs = {
  hideReels: true,
  hideExplore: true,
  hideSuggested: true,
  hideAds: true,
  hideUseApp: true,
  hideStories: false,
  hideDms: false,
};

const SUGGESTED_LABELS = new Set([
  "suggested for you",
  "senin için önerilenler",
  "suggested posts",
  "önerilen gönderiler",
]);

const ADS_LABELS = new Set([
  "sponsored",
  "sponsorlu",
  "paid partnership",
  "ücretli ortaklık",
]);

const USE_APP_LABELS = new Set([
  "use the app",
  "open in app",
  "open app",
  "get the app",
  "get app",
  "get the instagram app",
  "use instagram app",
  "use the instagram app",
  "uygulamayı kullan",
  "uygulamada aç",
  "uygulamayı indir",
  "instagram uygulamasını kullan",
  "instagram uygulamasını indir",
]);

export function loadPrefs(): LitePrefs {
  const prefs: LitePrefs = { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage?.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LitePrefs>;
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.hideReels === "boolean") prefs.hideReels = parsed.hideReels;
        if (typeof parsed.hideExplore === "boolean") prefs.hideExplore = parsed.hideExplore;
        if (typeof parsed.hideSuggested === "boolean") prefs.hideSuggested = parsed.hideSuggested;
        if (typeof parsed.hideAds === "boolean") prefs.hideAds = parsed.hideAds;
        if (typeof parsed.hideUseApp === "boolean") prefs.hideUseApp = parsed.hideUseApp;
        if (typeof parsed.hideStories === "boolean") prefs.hideStories = parsed.hideStories;
        if (typeof parsed.hideDms === "boolean") prefs.hideDms = parsed.hideDms;
      }
    }
  } catch {
    // Fall back to defaults when storage is unavailable or corrupted
  }
  return prefs;
}

export function savePrefs(prefs: LitePrefs): void {
  try {
    window.localStorage?.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage write errors (e.g. private mode / quota)
  }
}

export function buildStylesheet(): string {
  return `
html.ig-lite-hide-reels [data-ig-lite-hidden="reels"] {
  display: none !important;
}

html.ig-lite-hide-reels [data-ig-lite-blocked="reels"] {
  pointer-events: none !important;
  cursor: not-allowed !important;
}

html.ig-lite-hide-reels [data-ig-lite-blocked="reels"] * {
  pointer-events: none !important;
}

html.ig-lite-hide-reels [data-ig-lite-blocked-icon="reels"] {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

html.ig-lite-hide-reels [data-ig-lite-blocked-icon="reels"] > svg {
  opacity: 0.35 !important;
}

html.ig-lite-hide-reels [data-ig-lite-blocked-icon="reels"]::after {
  content: "BLOCKED" !important;
  position: absolute !important;
  top: -6px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: #dc2626 !important;
  color: #ffffff !important;
  font-size: 7px !important;
  font-weight: 800 !important;
  letter-spacing: 0.04em !important;
  padding: 1px 4px !important;
  border-radius: 4px !important;
  line-height: 1.1 !important;
  white-space: nowrap !important;
  pointer-events: none !important;
  z-index: 5 !important;
}

html.ig-lite-hide-explore [data-ig-lite-hidden="explore"] {
  display: none !important;
}

#ig-lite-explore-placeholder {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
  margin: 48px 20px;
  padding: 28px 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #a1a1aa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

html.ig-lite-hide-explore #ig-lite-explore-placeholder[data-active="true"] {
  display: flex;
}

#ig-lite-explore-placeholder strong {
  color: #fafafa;
  font-size: 15px;
  font-weight: 600;
}

#ig-lite-explore-placeholder span {
  font-size: 12px;
  line-height: 1.4;
}

#${SPLASH_ID} {
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483647 !important;
  background: #09090b !important;
  color: #fafafa !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  transition: opacity 240ms ease !important;
  pointer-events: none !important;
}

#${SPLASH_ID}[data-hiding="true"] {
  opacity: 0 !important;
}

html.ig-lite-hide-suggested [data-ig-lite-hidden="suggested"] {
  display: none !important;
}

html.ig-lite-hide-ads [data-ig-lite-hidden="ads"] {
  display: none !important;
}

html.ig-lite-hide-use-app a[href*="play.google.com"],
html.ig-lite-hide-use-app a[href*="apps.apple.com"],
html.ig-lite-hide-use-app a[href*="intent://"],
html.ig-lite-hide-use-app a[href*="onelink.me"],
html.ig-lite-hide-use-app [data-ig-lite-hidden="use-app"] {
  display: none !important;
}

html.ig-lite-hide-stories [data-ig-lite-hidden="stories"] {
  display: none !important;
}

html.ig-lite-hide-dms a[href*="/direct/"],
html.ig-lite-hide-dms [data-ig-lite-hidden="dms"] {
  display: none !important;
}

#${NAV_BTN_ID} {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  border: none !important;
  padding: 6px !important;
  margin: 0 8px 0 0 !important;
  color: inherit !important;
  cursor: pointer !important;
  border-radius: 9999px !important;
  flex-shrink: 0 !important;
  line-height: 1 !important;
  -webkit-tap-highlight-color: transparent !important;
}

#${NAV_BTN_ID}:active {
  opacity: 0.65 !important;
  transform: scale(0.94) !important;
}
`.trim();
}

export function syncHtmlClasses(prefs: LitePrefs): void {
  const docEl = document.documentElement;
  if (!docEl || !docEl.classList) return;
  docEl.classList.toggle("ig-lite-hide-reels", prefs.hideReels);
  docEl.classList.toggle("ig-lite-hide-explore", prefs.hideExplore);
  docEl.classList.toggle("ig-lite-hide-suggested", prefs.hideSuggested);
  docEl.classList.toggle("ig-lite-hide-ads", prefs.hideAds);
  docEl.classList.toggle("ig-lite-hide-use-app", prefs.hideUseApp);
  docEl.classList.toggle("ig-lite-hide-stories", prefs.hideStories);
  docEl.classList.toggle("ig-lite-hide-dms", prefs.hideDms);
}

export function injectStyleAndSync(prefs: LitePrefs): boolean {
  const target = document.head || document.documentElement;
  if (!target) return false;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildStylesheet();
    target.appendChild(style);
  }

  syncHtmlClasses(prefs);
  return true;
}

export function isReelsPath(urlOrPath: string | null | undefined): boolean {
  if (!urlOrPath || typeof urlOrPath !== "string") return false;
  let pathname = urlOrPath;
  try {
    const origin = window.location?.origin || "https://www.instagram.com";
    pathname = new URL(urlOrPath, origin).pathname;
  } catch {
    pathname = urlOrPath;
  }
  return /^\/reels(\/|$)/i.test(pathname);
}

export function redirectHomeIfReels(prefs: LitePrefs, targetPath?: string): boolean {
  if (!prefs.hideReels) return false;
  const pathToCheck =
    typeof targetPath === "string" ? targetPath : window.location?.pathname || "";
  if (isReelsPath(pathToCheck)) {
    window.location.replace("/");
    return true;
  }
  return false;
}

export function setupSpaProtection(getPrefs: () => LitePrefs): void {
  redirectHomeIfReels(getPrefs());

  if (window.history) {
    const origPushState = window.history.pushState;
    const origReplaceState = window.history.replaceState;

    if (typeof origPushState === "function") {
      window.history.pushState = function pushState(
        state: unknown,
        title: string,
        url?: string | URL | null
      ) {
        if (typeof url === "string" && redirectHomeIfReels(getPrefs(), url)) {
          return;
        }
        return origPushState.apply(this, [state, title, url]);
      };
    }

    if (typeof origReplaceState === "function") {
      window.history.replaceState = function replaceState(
        state: unknown,
        title: string,
        url?: string | URL | null
      ) {
        if (typeof url === "string" && redirectHomeIfReels(getPrefs(), url)) {
          return;
        }
        return origReplaceState.apply(this, [state, title, url]);
      };
    }
  }

  window.addEventListener("popstate", () => {
    redirectHomeIfReels(getPrefs());
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!getPrefs().hideReels || !event || !event.target) return;
      const target = event.target as Element;
      if (typeof target.closest !== "function") return;
      if (target.closest(`#${ROOT_ID}`)) return;

      const blocked = target.closest('[data-ig-lite-blocked="reels"]');
      const anchor = target.closest("a[href]");
      const href = anchor?.getAttribute("href");
      if (blocked || isReelsPath(href)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

function isInsideRoot(el: Element | null): boolean {
  return Boolean(el && typeof el.closest === "function" && el.closest(`#${ROOT_ID}`));
}

function markHidden(el: Element | null, category: string): void {
  if (!el || isInsideRoot(el)) return;
  if (el === document.documentElement || el === document.body) return;
  if (el.getAttribute("data-ig-lite-hidden") !== category) {
    el.setAttribute("data-ig-lite-hidden", category);
  }
}

function markNavBlocked(selector: string, category: string): void {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    if (isInsideRoot(node)) continue;
    const container =
      node.closest('a[href*="/reels"]') ||
      node.closest("a") ||
      node.closest('li, div[role="button"]') ||
      node;
    if (
      container &&
      !isInsideRoot(container) &&
      container !== document.documentElement &&
      container !== document.body &&
      !container.querySelector('a[href="/"], a[href="/explore/"], a[href*="/direct/"]')
    ) {
      if (container.getAttribute("data-ig-lite-blocked") !== category) {
        container.setAttribute("data-ig-lite-blocked", category);
      }
    }

    const svg =
      node.tagName.toLowerCase() === "svg"
        ? node
        : node.querySelector('svg[aria-label="Reels"], svg[aria-label="Reels\'lar"], svg');
    const iconBox = svg?.parentElement;
    if (
      iconBox &&
      !isInsideRoot(iconBox) &&
      iconBox !== document.documentElement &&
      iconBox !== document.body &&
      !iconBox.querySelector('a[href="/"], a[href="/explore/"], a[href*="/direct/"]')
    ) {
      if (iconBox.getAttribute("data-ig-lite-blocked-icon") !== category) {
        iconBox.setAttribute("data-ig-lite-blocked-icon", category);
      }
    }
  }
}

function scanReelsCarousels(): void {
  const regions = document.querySelectorAll('section, div[role="region"]');
  for (const region of regions) {
    if (isInsideRoot(region)) continue;
    if (region.getAttribute("data-ig-lite-hidden") === "reels") continue;
    if (region.querySelector('main, article, [role="article"]')) continue;

    const aria = (region.getAttribute("aria-label") || "").toLowerCase();
    if (aria.includes("reels")) {
      markHidden(region, "reels");
      continue;
    }

    const reelLinks = region.querySelectorAll('a[href*="/reel/"], a[href*="/reels/"]');
    if (reelLinks.length >= 2) {
      markHidden(region, "reels");
    }
  }
}

function scanFeedArticles(): void {
  const articles = document.querySelectorAll('article, [role="article"]');
  for (const article of articles) {
    if (isInsideRoot(article)) continue;
    const existing = article.getAttribute("data-ig-lite-hidden");
    if (existing === "ads" || existing === "suggested") continue;

    const labels = article.querySelectorAll("span, div, a");
    for (const label of labels) {
      if (isInsideRoot(label)) continue;
      const text = (label.textContent || "").trim();
      if (!text || text.length > 40) continue;
      const lower = text.toLowerCase();
      if (ADS_LABELS.has(lower)) {
        markHidden(article, "ads");
        break;
      }
      if (SUGGESTED_LABELS.has(lower)) {
        markHidden(article, "suggested");
        break;
      }
    }
  }
}

function findCompactPromptContainer(el: Element): Element {
  let current: Element | null = el;
  let candidate: Element = el;

  for (let depth = 0; depth < 5 && current; depth++) {
    const parent: Element | null = current.parentElement;
    if (
      !parent ||
      parent === document.body ||
      parent === document.documentElement ||
      parent.tagName === "MAIN" ||
      parent.tagName === "NAV" ||
      parent.querySelector("main, article, [role='article']")
    ) {
      break;
    }

    const role = parent.getAttribute("role");
    if (role === "banner" || role === "dialog" || parent.tagName === "HEADER") {
      return parent;
    }

    if (parent.parentElement === document.body) {
      return parent;
    }

    candidate = parent;
    current = parent;
  }

  return candidate;
}

function scanUseAppPrompts(): void {
  const appLinks = document.querySelectorAll(
    'a[href*="play.google.com"], a[href*="apps.apple.com"], a[href*="intent://"], a[href*="onelink.me"]'
  );
  for (const link of appLinks) {
    if (isInsideRoot(link)) continue;
    markHidden(findCompactPromptContainer(link), "use-app");
  }

  const candidates = document.querySelectorAll(
    'a, button, div[role="button"], span, p'
  );
  for (const el of candidates) {
    if (isInsideRoot(el)) continue;
    if (el.getAttribute("data-ig-lite-hidden") === "use-app") continue;
    const text = (el.textContent || "").trim();
    if (!text || text.length > 40) continue;
    if (USE_APP_LABELS.has(text.toLowerCase())) {
      markHidden(findCompactPromptContainer(el), "use-app");
    }
  }
}

const NAVBAR_FEED_LABELS = new Set([
  "for you",
  "sizin için",
  "following",
  "takip ettiklerin",
]);

function createIgLiteLogoSvg(size: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.9");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  frame.setAttribute("x", "3");
  frame.setAttribute("y", "3");
  frame.setAttribute("width", "18");
  frame.setAttribute("height", "18");
  frame.setAttribute("rx", "5.5");
  svg.appendChild(frame);

  const bolt = document.createElementNS("http://www.w3.org/2000/svg", "path");
  bolt.setAttribute("d", "M13 7.5 8.8 13h3.4l-.8 3.5L15.6 11h-3.4l.8-3.5Z");
  svg.appendChild(bolt);
  return svg;
}

export function showSplashScreen(): void {
  const docEl = document.documentElement;
  if (!docEl || document.getElementById(SPLASH_ID)) return;

  const splash = document.createElement("div");
  splash.id = SPLASH_ID;
  splash.appendChild(createIgLiteLogoSvg("54"));

  const label = document.createElement("span");
  label.textContent = "awagram";
  label.style.fontSize = "17px";
  label.style.fontWeight = "700";
  label.style.letterSpacing = "-0.02em";
  splash.appendChild(label);

  docEl.appendChild(splash);
}

export function dismissSplashIfReady(force = false): void {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash || splash.getAttribute("data-hiding") === "true") return;

  if (!force && !document.querySelector("main, header, nav, form")) {
    return;
  }

  splash.setAttribute("data-hiding", "true");
  window.setTimeout(() => {
    splash.remove();
  }, 260);
}

function createNavbarSettingsButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = NAV_BTN_ID;
  btn.type = "button";
  btn.setAttribute("aria-label", "awagram Settings");
  btn.title = "awagram Settings";

  btn.appendChild(createIgLiteLogoSvg("22"));
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
  });

  return btn;
}

export function ensureNavbarSettingsButton(): boolean {
  if (!document.body) return false;
  const pathname = window.location?.pathname || "/";
  const existing = document.getElementById(NAV_BTN_ID);

  // Only show the leading navbar button on the home feed
  if (pathname !== "/") {
    existing?.remove();
    return false;
  }

  if (existing) return true;

  const candidates = document.querySelectorAll(
    'header span, header div, header a, header button, h1, h2, div[role="button"] span, div[role="button"]'
  );
  for (const el of candidates) {
    if (isInsideRoot(el)) continue;
    const text = (el.textContent || "").trim().toLowerCase();
    if (!NAVBAR_FEED_LABELS.has(text)) continue;

    let target: Element = el;
    for (let i = 0; i < 4 && target.parentElement; i++) {
      const parent = target.parentElement;
      if (parent === document.body || parent === document.documentElement) break;
      const role = target.getAttribute("role");
      if (
        (role === "button" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          parent.tagName === "HEADER" ||
          parent.children.length >= 2) &&
        parent.children.length >= 2
      ) {
        const btn = createNavbarSettingsButton();
        parent.insertBefore(btn, target);
        return true;
      }
      target = parent;
    }
  }

  return false;
}

const EXPLORE_PLACEHOLDER_ID = "ig-lite-explore-placeholder";

function ensureExplorePlaceholder(main: Element, active: boolean): void {
  let placeholder = document.getElementById(EXPLORE_PLACEHOLDER_ID);
  if (!placeholder && active) {
    placeholder = document.createElement("div");
    placeholder.id = EXPLORE_PLACEHOLDER_ID;

    const title = document.createElement("strong");
    title.textContent = "Explore is hidden";
    const sub = document.createElement("span");
    sub.textContent = "You can still search for accounts above, or change this in awagram Settings.";

    placeholder.appendChild(title);
    placeholder.appendChild(sub);
    main.appendChild(placeholder);
  }
  if (placeholder) {
    placeholder.setAttribute("data-active", active ? "true" : "false");
  }
}

function isSearchOverlayActive(main: Element): boolean {
  const searchInput = main.querySelector(
    'input[type="search"], input[aria-label*="Search" i], input[aria-label*="Ara" i], input[placeholder*="Search" i], input[placeholder*="Ara" i]'
  ) as HTMLInputElement | null;

  if (searchInput) {
    if (searchInput.value.trim().length > 0) return true;
    if (document.activeElement === searchInput) return true;
  }

  // Instagram shows "Cancel" / "Clear all" / "Recent" when search mode is active
  const buttons = main.querySelectorAll('button, div[role="button"], span');
  for (const el of buttons) {
    if (isInsideRoot(el) || el.id === EXPLORE_PLACEHOLDER_ID) continue;
    const text = (el.textContent || "").trim().toLowerCase();
    if (
      text === "cancel" ||
      text === "iptal" ||
      text === "clear all" ||
      text === "tümünü temizle"
    ) {
      return true;
    }
  }

  return false;
}

function scanExploreGrid(): void {
  const pathname = window.location?.pathname || "";
  const isExplore = /^\/explore(\/|$)/i.test(pathname);
  const existingPlaceholder = document.getElementById(EXPLORE_PLACEHOLDER_ID);

  if (!isExplore) {
    if (existingPlaceholder) {
      existingPlaceholder.setAttribute("data-active", "false");
    }
    return;
  }

  const main = document.querySelector("main") || document.body;
  if (!main || isInsideRoot(main)) return;

  // Hide placeholder whenever user is in search mode (focused, typing, or viewing Recent)
  if (isSearchOverlayActive(main)) {
    ensureExplorePlaceholder(main, false);
    return;
  }

  // Hide media grid containers on /explore/ that don't wrap the search input
  let hidGrid = false;
  const gridCandidates = main.querySelectorAll("div, section");
  for (const el of gridCandidates) {
    if (isInsideRoot(el) || el.id === EXPLORE_PLACEHOLDER_ID) continue;
    if (el.getAttribute("data-ig-lite-hidden") === "explore") {
      hidGrid = true;
      continue;
    }
    if (el.querySelector("input")) continue;
    const mediaLinks = el.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
    if (mediaLinks.length >= 3) {
      markHidden(el, "explore");
      hidGrid = true;
    }
  }

  ensureExplorePlaceholder(main, hidGrid);
}

function scanStoriesTray(): void {
  const pathname = window.location?.pathname || "/";
  if (pathname !== "/") return;

  const main = document.querySelector("main") || document.body;
  if (!main || isInsideRoot(main)) return;

  const storyTriggers = main.querySelectorAll(
    'button[aria-label*="Story" i], button[aria-label*="Hikaye" i], div[role="button"][aria-label*="Story" i], div[role="button"][aria-label*="Hikaye" i]'
  );
  for (const trigger of storyTriggers) {
    if (isInsideRoot(trigger)) continue;
    let container: Element | null = trigger;
    for (let i = 0; i < 6 && container?.parentElement; i++) {
      const parent: Element = container.parentElement;
      if (
        parent === main ||
        parent === document.body ||
        parent.querySelector("article, [role='article']")
      ) {
        break;
      }
      if (
        parent.getAttribute("role") === "menu" ||
        parent.tagName === "SECTION" ||
        parent.querySelectorAll('button[aria-label*="Story" i], div[role="button"][aria-label*="Story" i]').length >= 2
      ) {
        container = parent;
      } else {
        container = parent;
      }
    }
    if (container && container !== main && !container.querySelector("article, [role='article']")) {
      markHidden(container, "stories");
    }
  }
}

function scanDmNavItems(): void {
  const nodes = document.querySelectorAll(
    'a[href*="/direct/"], svg[aria-label="Direct"], svg[aria-label="Messenger"], svg[aria-label="Messages"]'
  );
  for (const node of nodes) {
    if (isInsideRoot(node)) continue;
    const target =
      node.closest('a[href*="/direct/"]') ||
      node.closest("a") ||
      node.closest('div[role="button"]') ||
      node;
    if (
      target &&
      !target.querySelector('a[href="/"], a[href="/explore/"], a[href*="/reels"]')
    ) {
      markHidden(target, "dms");
    }
  }
}

export function scanDom(): void {
  if (!document.documentElement) return;
  markNavBlocked(
    'a[href="/reels/"], a[href*="/reels/"], a[href^="/reels"], svg[aria-label="Reels"], svg[aria-label="Reels\'lar"]',
    "reels"
  );
  scanReelsCarousels();
  scanExploreGrid();
  scanStoriesTray();
  scanDmNavItems();
  scanFeedArticles();
  scanUseAppPrompts();
  ensureNavbarSettingsButton();
}

export function setupShakeToOpen(): void {
  let lastX: number | null = null;
  let lastY: number | null = null;
  let lastZ: number | null = null;
  let lastShakeAt = 0;
  let spikeCount = 0;
  let lastSpikeAt = 0;

  window.addEventListener("devicemotion", (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    const x = acc.x ?? 0;
    const y = acc.y ?? 0;
    const z = acc.z ?? 0;

    if (lastX === null || lastY === null || lastZ === null) {
      lastX = x;
      lastY = y;
      lastZ = z;
      return;
    }

    const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
    lastX = x;
    lastY = y;
    lastZ = z;

    if (delta > 26) {
      const now = Date.now();
      if (now - lastSpikeAt < 600) {
        spikeCount += 1;
      } else {
        spikeCount = 1;
      }
      lastSpikeAt = now;

      if (spikeCount >= 2 && now - lastShakeAt > 1200) {
        lastShakeAt = now;
        spikeCount = 0;
        window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
      }
    }
  });

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key?.toLowerCase() === "l") {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
    }
  });
}
