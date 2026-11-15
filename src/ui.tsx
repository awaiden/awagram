import * as React from "react";
import { createRoot } from "react-dom/client";
import { ROOT_ID, loadPrefs, type LitePrefs } from "./core";
import { LiteSettingsDrawer } from "./components/LiteSettingsDrawer";
import overlayStyles from "./styles.css?inline";

function mountReactDrawer(): void {
  if (!document.body || document.getElementById(ROOT_ID)) {
    return;
  }

  const host = document.createElement("div");
  host.id = ROOT_ID;
  const shadow = host.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = overlayStyles;
  shadow.appendChild(styleEl);

  const appContainer = document.createElement("div");
  shadow.appendChild(appContainer);

  const portalContainer = document.createElement("div");
  shadow.appendChild(portalContainer);

  document.body.appendChild(host);

  const initialPrefs: LitePrefs = window.__IG_LITE_PREFS__ || loadPrefs();
  const handleChange = (next: LitePrefs) => {
    if (typeof window.__IG_LITE_ON_PREFS_CHANGE__ === "function") {
      window.__IG_LITE_ON_PREFS_CHANGE__(next);
    }
  };

  createRoot(appContainer).render(
    <React.StrictMode>
      <LiteSettingsDrawer
        initialPrefs={initialPrefs}
        portalContainer={portalContainer}
        onChangePrefs={handleChange}
      />
    </React.StrictMode>
  );
}

mountReactDrawer();
