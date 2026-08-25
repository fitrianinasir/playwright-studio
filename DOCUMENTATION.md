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

Pipeline:

1. Playwright screenshots the target on the live page and collects text bounding boxes.
2. Design source:
   - **Figma API** if the URL is a Figma file and `FIGMA_ACCESS_TOKEN` is set (exports the node image + text boxes).
   - Otherwise a second Playwright capture of that URL with the same selector (**design page**).
3. Live image is resized to the design size.
4. **Dummy-text whitelist**: design text that looks like placeholder copy (lorem, John Doe, example.com, etc.), or live text that does not match the spatially aligned design text, is masked on **both** images.
5. pixelmatch produces a raw diff and a whitelisted diff. The score you care about is **after dummy whitelist** — layout/spacing can still approach 100% even when Figma used fake copy and production has real data.

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
