# Visual-Testing-Automation — Playwright Studio

This app is a no-code Playwright studio for frontend visual and e2e checks. You compose steps in the UI, Playwright runs them on the server, and results (screenshots, diffs, logs) stay in memory until the Next.js process restarts. There is no database, login, or multi-project setup.

UI is built with Next.js, Tailwind CSS, and shadcn/ui. Browsers are driven by Playwright. Pixel diffs use pixelmatch.

## Run locally

```bash
npm install
npm run playwright:install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Chromium is required for the default demos. Firefox and WebKit are optional and need the install command above.

If Playwright says the browser executable is missing, run `npm run playwright:install` **outside** a sandbox (normal terminal), then restart `npm run dev`.

Optional: put `FIGMA_ACCESS_TOKEN` in `.env.local` when comparing a real Figma file URL. Without it, use a design **page** URL (the bundled `/demo/figma` works).

## What you see in the sidebar

| Nav | URL | Purpose |
| --- | --- | --- |
| Scenarios | `/` | List and create test scenarios |
| Composer | `/builder/[scenarioId]` | Drag-and-drop step chain, then run |
| Figma visual | `/visual` | One-off section compare (webpage vs design) |
| Regression | `/regression` | Baseline vs latest screenshot, with diff |
| Reports | `/runs` and `/runs/[runId]` | Pass/fail, logs, images, HTML export |
| Demo webpage | `/demo/webpage` | Live dummy page used by the Figma demo |

There is a single in-memory workspace (`proj_acme`). Creating extra projects is not supported.

## End-to-end workflow

```
Compose scenario  →  Save  →  Run (Playwright)  →  Report
                                      ↓
                         Screenshot / Figma compare
                                      ↓
                         Baseline (first capture) or pixel diff
                                      ↓
                         Regression dashboard
```

1. Open **Scenarios**. Two samples are seeded:
   - **Login → home snapshot** — e2e against the dummy app, then a named screenshot.
   - **Hero vs Figma design** — visual compare of `#compare-target` on `/demo/webpage` vs `/demo/figma`.
2. Open **Edit in composer**. Drag actions from the palette onto the canvas (or click **+**). Reorder by dragging. Fill selectors and values in the inspector.
3. Choose browsers (Chromium, Firefox, WebKit) and a device (desktop 1280×900, iPhone 14, or Pixel 7).
4. **Save scenario**, then **Run on selected browsers**.
5. Playwright launches headless browsers, executes steps in order, and stops that browser’s remaining steps after a failure (they show as skipped).
6. You land on the **report**: status, per-step logs, screenshots, diffs. **Export HTML report** downloads a standalone file. **Set as baseline** replaces the stored baseline for that snapshot.

Refreshing the browser does **not** wipe studio data. Restarting `npm run dev` does.

## Scenario composer (no-code e2e)

Steps run in order on one page session per browser.

| Action | What it does |
| --- | --- |
| Navigate | `page.goto`. Relative paths (e.g. `/demo/app/login`) are resolved against the Studio origin (`http://localhost:3000` in dev). |
| Login | Fill email + password fields and click submit. This tests **your page**, not Studio itself. |
| Fill / Click / Hover / Select option | Standard Playwright locator actions. |
| Wait | `timeout` + milliseconds, or `selector` until visible. |
| Assert text | Inner text of a locator must contain the expected string. |
| Assert visible | Locator must become visible. |
| Screenshot | Capture `body` or a selector. Compared to a named baseline (see below). Fails if match is under **98%**. |
| Figma visual compare | Runs the same pipeline as **Figma visual**. Fails if whitelisted accuracy is under **90%**. Blank webpage URL means “current page”. |

The first failing step fails the browser run. Later steps are skipped.

### Try the seeded login scenario

The dummy product app (not a Studio login) is:

- Login: [http://localhost:3000/demo/app/login](http://localhost:3000/demo/app/login)
- Home: [http://localhost:3000/demo/app/home](http://localhost:3000/demo/app/home)
- Credentials: `designer@acme.test` / `password123`
- Selectors: `#email`, `#password`, `button[type=submit]`, `#welcome-title`, `#welcome-panel`

## Figma / design visual compare

Used from **Figma visual** or from a **Figma visual compare** step.

Inputs:

1. **Webpage URL** — live page to capture.
2. **Targeted ID / selector** — section to screenshot (`compare-target` or `#compare-target`).
3. **Figma URL section** — either a `figma.com` file/node link **or** any http(s) page that renders the design (demo: `/demo/figma`).

### TesterApp → `/api/compare` chain

The **Figma visual** screen (`TesterApp` in `src/components/tester-app.tsx`) only talks to one API: `POST /api/compare`. Everything else is server-side function chaining inside `runVisualCompare`.

```
TesterApp (form)
    │  POST { webpageUrl, targetId, figmaUrl }
    ▼
/api/compare  →  runVisualCompare()
    │
    ├─ assertHttpUrl          validate both URLs
    ├─ cssTargetSelector      turn id into CSS selector (#…)
    ├─ parseFigmaUrl          detect real Figma link vs design page
    │
    ├─ withBrowser + captureSelector   screenshot LIVE page + text boxes
    │
    ├─ design source (branch)
    │     ├─ fetchFigmaSection   Figma API image + text nodes (needs token)
    │     └─ withBrowser + captureSelector   or screenshot design PAGE
    │
    ├─ pngFromBuffer          decode PNGs
    ├─ resizePng              fit live image to design size
    ├─ buildWhitelist         find dummy / mismatched text regions
    ├─ uniqueWhitelist        de-dupe whitelist rows for the UI table
    ├─ applyTextMasks         paint over those regions on both images
    ├─ diffPngs (×2)          raw diff + whitelisted diff (pixelmatch)
    └─ accuracyFromDiff / pngToDataUrl   scores + data-URL images → JSON
```

| Step | Where | Short role |
| --- | --- | --- |
| Form submit | `tester-app.tsx` | Collects the three fields; `fetch("/api/compare")`; stores the JSON result in React state (not Zustand). |
| `POST` handler | `api/compare/route.ts` | Validates required fields, calls `runVisualCompare`, returns JSON or error. |
| `runVisualCompare` | `compare.ts` | Orchestrator for the whole pipeline. |
| `assertHttpUrl` | `compare.ts` | Ensures webpage/figma values are valid `http(s)` URLs. |
| `cssTargetSelector` | `capture.ts` | Normalizes `compare-target` → `#compare-target` (or leaves a full selector alone). |
| `parseFigmaUrl` | `figma.ts` | If host is figma.com, extracts `fileKey` + `node-id`; otherwise `null` → design-page path. |
| `withBrowser` | `capture.ts` | Launches Chromium (falls back to Chrome/Edge), opens a page, closes the browser after. |
| `captureSelector` | `capture.ts` | `goto` URL, wait for selector, screenshot that node, collect text bounding boxes. |
| `fetchFigmaSection` | `figma.ts` | Calls Figma Images + Nodes APIs; returns PNG buffer, size, and text boxes. |
| `pngFromBuffer` | `image-compare.ts` | Parses PNG bytes into a pixel buffer. |
| `resizePng` | `image-compare.ts` | Scales the live capture to the design width/height when they differ. |
| `buildWhitelist` | `dummy-text.ts` | Marks regions that look like dummy copy or don’t match live text at the same spot. |
| `uniqueWhitelist` | `dummy-text.ts` | Removes duplicate whitelist rows for the results table. |
| `applyTextMasks` | `image-compare.ts` | Fills whitelist boxes with a flat mask color on both images. |
| `diffPngs` | `image-compare.ts` | pixelmatch → mismatch count + red-highlight diff image. |
| `accuracyFromDiff` | `image-compare.ts` | Turns mismatches into a 0–100% score. |
| `pngToDataUrl` | `image-compare.ts` | Encodes PNGs as `data:image/png;base64,…` for the UI. |

UI then shows scores, whitelist table, and raw / whitelisted / source image tabs. Refreshing the page clears this result (session-only React state).

### Waiting for intro animations

Before every screenshot, `captureSelector` **always** waits until animations are fully settled:

1. Prefers `networkidle` (falls back to `load` if the site never goes idle).
2. Waits until the target selector is visible.
3. Waits for fonts, then **awaits every finite CSS/Web Animation** (`getAnimations({ subtree: true })`) and requires a **500ms quiet window** with no new running finite animations (infinite loops like spinners are ignored).
4. Waits for `<img>` elements to finish loading.
5. Optional **extra settle ms** (Figma visual form; default `3000`) for GSAP/canvas intros that don’t use the Web Animations API.
6. Screenshots with `animations: "disabled"` so leftover CSS transitions don’t blur the shot.

For [Ocean BCA](https://ocean.bca.co.id/id), keep **Extra settle after animations** at `3000`–`5000`.

Ad-hoc runs on **Figma visual** are only shown on that screen. To keep history, put the same compare in a scenario and run it from the composer.

### Local Figma demo

1. Open `/demo/webpage` (real-ish copy) and `/demo/figma` (placeholder copy). Both wrap the hero in `#compare-target`.
2. On **Figma visual**, click **Use local demo**, then **Run visual test**.
3. Inspect raw vs whitelisted diffs and the whitelist table.

## Visual regression

Screenshot steps (and Figma compares that produce images) key a baseline by:

`project + scenario + snapshot name + browser + device`

- **First capture** is stored as the baseline (treated as 100% match).
- Later captures are resized if needed and diffed. Mismatches show as highlighted pixels.
- **Regression** lists each baseline next to the latest matching run.
- On a report, **Set as baseline** promotes the latest image.

Screenshot regression fails the step below **98%** pixel match. Figma-in-scenario fails below **90%** after whitelist.

## Reports

Each run records:

- Overall and per-browser pass/fail
- Step status, duration, log, error
- Latest / baseline / diff images when a step captured pixels
- Runner log lines (which browser started, how many steps passed)

Export: `GET /api/runs/[runId]/export` (the **Export HTML report** button).

## Architecture (short)

| Piece | Role |
| --- | --- |
| Next.js App Router UI | Composer, dashboards, demo pages |
| API routes (`nodejs`) | Start Playwright, return JSON / HTML |
| `src/lib/store.ts` | Zustand vanilla store for projects, scenarios, runs, baselines (HMR-safe singleton; cleared on process exit) |
| `src/lib/runner.ts` | Execute scenario steps, multi-browser, devices |
| `src/lib/compare.ts` | Figma/design visual pipeline |
| `src/lib/dummy-text.ts` | Whitelist dummy vs live copy |
| `src/lib/image-compare.ts` | Resize, mask, pixelmatch |

Playwright cannot run in the browser; every capture goes through the Next server. Relative URLs in steps are resolved from the request `Origin` (your Studio URL).

## Limits

- One workspace, no persistence, no auth.
- Large screenshots live as data URLs in memory; keep runs short in this prototype.
- Firefox/WebKit fail until those browsers are installed.
- Real Figma files need a token; file links without a token error on purpose so you can switch to a design page.
- Dummy whitelist is heuristic (patterns + spatial text mismatch). Unusual placeholder copy may still count as layout noise.
