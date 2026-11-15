import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const tmpDir = path.join(rootDir, "node_modules/.ig-lite-tmp");

await build({
  configFile: false,
  root: rootDir,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: tmpDir,
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    lib: {
      entry: path.join(rootDir, "src/early.ts"),
      name: "IgLiteEarly",
      formats: ["iife"],
      fileName: () => "early.js",
    },
  },
});

await build({
  configFile: false,
  root: rootDir,
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: tmpDir,
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    lib: {
      entry: path.join(rootDir, "src/ui.tsx"),
      name: "IgLiteUi",
      formats: ["iife"],
      fileName: () => "ui.js",
    },
  },
});

const earlyCode = fs.readFileSync(path.join(tmpDir, "early.js"), "utf8");
const uiCode = fs.readFileSync(path.join(tmpDir, "ui.js"), "utf8");

const combined = `window.__IG_LITE_LOAD_UI__=function(){\n${uiCode}\n};\n${earlyCode}\n`;
fs.writeFileSync(path.join(rootDir, "src-tauri/src/inject.js"), combined, "utf8");
console.log(
  `Built src-tauri/src/inject.js (${(Buffer.byteLength(combined) / 1024).toFixed(2)} kB)`
);
