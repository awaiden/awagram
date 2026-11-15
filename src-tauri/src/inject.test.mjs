import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const injectPath = path.join(__dirname, 'inject.js');
const injectCode = fs.readFileSync(injectPath, 'utf8');

function createTestEnv({
  url = 'https://www.instagram.com/',
  isIframe = false,
  storedPrefs = null,
  cookie = '',
  fetchImpl = null,
} = {}) {
  const win = new Window({ url });
  if (cookie) {
    win.document.cookie = cookie;
  }
  if (storedPrefs !== null) {
    win.localStorage.setItem('ig_lite_prefs', JSON.stringify(storedPrefs));
  }

  let replacedUrl = null;
  const origLocation = win.location;
  const locationProxy = new Proxy(origLocation, {
    get(target, prop) {
      if (prop === 'replace') {
        return (nextUrl) => {
          replacedUrl = nextUrl;
        };
      }
      const val = Reflect.get(target, prop);
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });

  const context = {
    window: win,
    document: win.document,
    navigator: win.navigator,
    localStorage: win.localStorage,
    history: win.history,
    location: locationProxy,
    MutationObserver: win.MutationObserver,
    CustomEvent: win.CustomEvent,
    Event: win.Event,
    MouseEvent: win.MouseEvent,
    KeyboardEvent: win.KeyboardEvent,
    PointerEvent: win.PointerEvent || win.MouseEvent,
    HTMLElement: win.HTMLElement,
    Element: win.Element,
    Node: win.Node,
    URL: win.URL,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    requestAnimationFrame: (cb) => globalThis.setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id) => globalThis.clearTimeout(id),
    queueMicrotask: globalThis.queueMicrotask,
    MessageChannel: globalThis.MessageChannel,
    fetch: fetchImpl || globalThis.fetch,
    DOMException: globalThis.DOMException,
    AbortController: globalThis.AbortController,
    URLSearchParams: globalThis.URLSearchParams,
    console: globalThis.console,
    getComputedStyle: win.getComputedStyle.bind(win),
    matchMedia: win.matchMedia.bind(win),
  };

  Object.defineProperty(win, 'location', {
    configurable: true,
    get: () => locationProxy,
  });

  if (isIframe) {
    Object.defineProperty(win, 'top', { configurable: true, get: () => ({}) });
    Object.defineProperty(win, 'self', { configurable: true, get: () => win });
  } else {
    Object.defineProperty(win, 'top', { configurable: true, get: () => win });
    Object.defineProperty(win, 'self', { configurable: true, get: () => win });
  }

  vm.runInNewContext(injectCode, context);

  return {
    win,
    doc: win.document,
    getReplacedUrl: () => replacedUrl,
    resetReplacedUrl: () => {
      replacedUrl = null;
    },
    cleanup: async () => {
      await win.happyDOM.close();
    },
  };
}

const flush = (ms = 30) => new Promise((r) => setTimeout(r, ms));

test('ignores iframe execution and prevents double initialization', async () => {
  const iframeEnv = createTestEnv({ isIframe: true });
  assert.equal(iframeEnv.doc.getElementById('ig-lite-style'), null);
  assert.equal(iframeEnv.win.__IG_LITE_INITIALIZED__, undefined);
  await iframeEnv.cleanup();

  const mainEnv = createTestEnv();
  assert.ok(mainEnv.doc.getElementById('ig-lite-style'));
  assert.equal(mainEnv.win.__IG_LITE_INITIALIZED__, true);
  await mainEnv.cleanup();
});

test('injects FOUC-free stylesheet and default hide classes including hideUseApp', async () => {
  const env = createTestEnv();
  const styleEl = env.doc.getElementById('ig-lite-style');
  assert.ok(styleEl);
  assert.match(styleEl.textContent, /ig-lite-hide-reels/);
  assert.match(styleEl.textContent, /ig-lite-hide-explore/);
  assert.match(styleEl.textContent, /ig-lite-hide-suggested/);
  assert.match(styleEl.textContent, /ig-lite-hide-use-app/);

  const cls = env.doc.documentElement.classList;
  assert.equal(cls.contains('ig-lite-hide-reels'), true);
  assert.equal(cls.contains('ig-lite-hide-explore'), true);
  assert.equal(cls.contains('ig-lite-hide-suggested'), true);
  assert.equal(cls.contains('ig-lite-hide-use-app'), true);
  await env.cleanup();
});

test('hides Use the app / Uygulamayı kullan banners and app store links by default', async () => {
  const env = createTestEnv();
  const banner = env.doc.createElement('div');
  banner.setAttribute('role', 'banner');
  const btn = env.doc.createElement('a');
  btn.textContent = 'Use the app';
  banner.appendChild(btn);

  const trBanner = env.doc.createElement('div');
  const trSpan = env.doc.createElement('span');
  trSpan.textContent = 'Uygulamayı kullan';
  trBanner.appendChild(trSpan);

  const main = env.doc.createElement('main');
  const article = env.doc.createElement('article');
  article.textContent = 'Normal user post';
  main.appendChild(article);

  env.doc.body.appendChild(banner);
  env.doc.body.appendChild(trBanner);
  env.doc.body.appendChild(main);

  await flush(50);

  assert.equal(banner.getAttribute('data-ig-lite-hidden'), 'use-app');
  assert.equal(trBanner.getAttribute('data-ig-lite-hidden'), 'use-app');
  assert.equal(main.getAttribute('data-ig-lite-hidden'), null);
  assert.equal(article.getAttribute('data-ig-lite-hidden'), null);
  await env.cleanup();
});

test('redirects /reels on initial load, pushState, replaceState, and blocks link click without reload', async () => {
  const initialReels = createTestEnv({ url: 'https://www.instagram.com/reels/123/' });
  assert.equal(initialReels.getReplacedUrl(), '/');
  await initialReels.cleanup();

  const env = createTestEnv({ url: 'https://www.instagram.com/' });
  env.win.history.pushState({}, '', '/reels/');
  assert.equal(env.getReplacedUrl(), '/');

  env.resetReplacedUrl();
  env.win.history.replaceState({}, '', '/reels/abc');
  assert.equal(env.getReplacedUrl(), '/');

  env.resetReplacedUrl();
  let bubbleReached = false;
  env.doc.body.addEventListener('click', () => {
    bubbleReached = true;
  });
  const link = env.doc.createElement('a');
  link.setAttribute('href', '/reels/xyz');
  env.doc.body.appendChild(link);
  link.click();
  assert.equal(env.getReplacedUrl(), null, 'should not reload page on blocked Reels link click');
  assert.equal(bubbleReached, false, 'click event should be stopped before reaching React/Instagram');

  await env.cleanup();
});

test('DOM mutation observer hides Suggested/Sponsored posts and Reels, while preserving Search link', async () => {
  const env = createTestEnv();

  const article = env.doc.createElement('article');
  const label = env.doc.createElement('span');
  label.textContent = 'Senin için önerilenler';
  article.appendChild(label);

  const adArticle = env.doc.createElement('article');
  const adLabel = env.doc.createElement('span');
  adLabel.textContent = 'Sponsorlu';
  adArticle.appendChild(adLabel);

  const navLi = env.doc.createElement('li');
  const reelsLink = env.doc.createElement('a');
  reelsLink.setAttribute('href', '/reels/');
  navLi.appendChild(reelsLink);

  const exploreLi = env.doc.createElement('li');
  const exploreLink = env.doc.createElement('a');
  exploreLink.setAttribute('href', '/explore/');
  exploreLi.appendChild(exploreLink);

  env.doc.body.appendChild(article);
  env.doc.body.appendChild(adArticle);
  env.doc.body.appendChild(navLi);
  env.doc.body.appendChild(exploreLi);

  await flush(50);

  assert.equal(article.getAttribute('data-ig-lite-hidden'), 'suggested');
  assert.equal(adArticle.getAttribute('data-ig-lite-hidden'), 'ads');
  assert.equal(reelsLink.getAttribute('data-ig-lite-blocked'), 'reels');
  assert.equal(exploreLi.getAttribute('data-ig-lite-hidden'), null);
  await env.cleanup();
});

test('on /explore/ hides discovery media grid, shows Explore is hidden placeholder, and preserves search input', async () => {
  const env = createTestEnv({ url: 'https://www.instagram.com/explore/' });

  const main = env.doc.createElement('main');
  const searchWrap = env.doc.createElement('div');
  const searchInput = env.doc.createElement('input');
  searchInput.setAttribute('type', 'search');
  searchInput.setAttribute('placeholder', 'Search');
  searchWrap.appendChild(searchInput);

  const grid = env.doc.createElement('div');
  for (let i = 0; i < 4; i++) {
    const post = env.doc.createElement('a');
    post.setAttribute('href', `/p/post${i}/`);
    grid.appendChild(post);
  }

  main.appendChild(searchWrap);
  main.appendChild(grid);
  env.doc.body.appendChild(main);

  await flush(50);

  assert.equal(searchWrap.getAttribute('data-ig-lite-hidden'), null);
  assert.equal(grid.getAttribute('data-ig-lite-hidden'), 'explore');

  const placeholder = env.doc.getElementById('ig-lite-explore-placeholder');
  assert.ok(placeholder, 'Explore placeholder should be rendered');
  assert.equal(placeholder.getAttribute('data-active'), 'true');
  assert.match(placeholder.textContent, /Explore is hidden/);

  // When search mode is active (e.g. Cancel / Clear all shown), placeholder must hide
  const cancelBtn = env.doc.createElement('button');
  cancelBtn.textContent = 'Cancel';
  main.appendChild(cancelBtn);
  await flush(50);
  assert.equal(placeholder.getAttribute('data-active'), 'false');

  await env.cleanup();
});

function triggerShake(win) {
  const mkMotion = (x, y, z) => {
    const ev = new win.Event('devicemotion');
    ev.accelerationIncludingGravity = { x, y, z };
    return ev;
  };
  win.dispatchEvent(mkMotion(0, 0, 9.8));
  win.dispatchEvent(mkMotion(30, 0, 9.8));
  win.dispatchEvent(mkMotion(-30, 0, 9.8));
}

test('renders React shadcn Bottom Sheet in Shadow DOM without floating button, opens on shake, and persists toggles', async () => {
  const env = createTestEnv();
  await flush(50);

  const host = env.doc.getElementById('ig-lite-root');
  assert.ok(host);
  assert.ok(host.shadowRoot);
  assert.equal(host.shadowRoot.getElementById('ig-lite-toggle-btn'), null);

  triggerShake(env.win);
  await flush(50);

  const useAppSwitch = host.shadowRoot.getElementById('ig-lite-switch-hideUseApp');
  assert.ok(useAppSwitch);
  assert.equal(useAppSwitch.getAttribute('aria-checked'), 'true');

  useAppSwitch.click();
  await flush(30);

  assert.equal(env.doc.documentElement.classList.contains('ig-lite-hide-use-app'), false);
  const saved = JSON.parse(env.win.localStorage.getItem('ig_lite_prefs'));
  assert.equal(saved.hideUseApp, false);

  await env.cleanup();
});

test('inserts navbar settings button to the left of For you and opens Drawer on click', async () => {
  const env = createTestEnv();

  const header = env.doc.createElement('header');
  const forYouBtn = env.doc.createElement('div');
  forYouBtn.setAttribute('role', 'button');
  const forYouSpan = env.doc.createElement('span');
  forYouSpan.textContent = 'For you';
  forYouBtn.appendChild(forYouSpan);

  const rightGroup = env.doc.createElement('div');
  header.appendChild(forYouBtn);
  header.appendChild(rightGroup);
  env.doc.body.appendChild(header);

  await flush(60);

  const navBtn = env.doc.getElementById('ig-lite-nav-settings-btn');
  assert.ok(navBtn, 'navbar settings button should be inserted');
  assert.equal(header.firstElementChild, navBtn, 'settings button should be to the left of For you');
  assert.equal(navBtn.nextElementSibling, forYouBtn);

  navBtn.click();
  await flush(50);

  const host = env.doc.getElementById('ig-lite-root');
  const useAppSwitch = host.shadowRoot.getElementById('ig-lite-switch-hideUseApp');
  assert.ok(useAppSwitch, 'clicking navbar settings button should open the Drawer');

  await env.cleanup();
});

test('fetches and lists non-followers via Instagram Web API in Takip Etmeyenler tab', async () => {
  const mockFetch = async (url) => {
    const u = String(url);
    if (u.includes('/following/')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          users: [
            { pk: '1', username: 'alice', full_name: 'Alice', is_verified: false },
            { pk: '2', username: 'bob_unfollow', full_name: 'Bob', is_verified: true },
          ],
          next_max_id: null,
        }),
      };
    }
    if (u.includes('/followers/')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          users: [{ pk: '1', username: 'alice', full_name: 'Alice', is_verified: false }],
          next_max_id: null,
        }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

  const env = createTestEnv({
    cookie: 'ds_user_id=999; csrftoken=abc123',
    fetchImpl: mockFetch,
  });

  await flush(50);
  const host = env.doc.getElementById('ig-lite-root');
  triggerShake(env.win);
  await flush(50);

  const tabBtn = host.shadowRoot.getElementById('ig-lite-tab-non-followers');
  assert.ok(tabBtn);
  tabBtn.click();
  await flush(30);

  const scanBtn = host.shadowRoot.getElementById('ig-lite-scan-non-followers');
  assert.ok(scanBtn);
  scanBtn.click();
  await flush(80);

  const contentText = host.shadowRoot.textContent;
  assert.match(contentText, /@bob_unfollow/);
  assert.doesNotMatch(contentText, /@alice/);

  const cachedRaw = env.win.localStorage.getItem('ig_lite_non_followers');
  assert.ok(cachedRaw, 'non-followers result should be persisted in localStorage');
  const cached = JSON.parse(cachedRaw);
  assert.equal(cached.notFollowingBack.length, 1);
  assert.equal(cached.notFollowingBack[0].username, 'bob_unfollow');

  await env.cleanup();

  // Verify cached result loads automatically on next session without re-fetching
  const env2 = createTestEnv({
    storedPrefs: null,
  });
  env2.win.localStorage.setItem('ig_lite_non_followers', cachedRaw);
  await flush(50);
  const host2 = env2.doc.getElementById('ig-lite-root');
  triggerShake(env2.win);
  await flush(40);
  host2.shadowRoot.getElementById('ig-lite-tab-non-followers').click();
  await flush(40);
  assert.match(host2.shadowRoot.textContent, /@bob_unfollow/);
  await env2.cleanup();
});
