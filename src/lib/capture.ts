import type { Browser, Page } from "playwright";
import { chromium, firefox, webkit } from "playwright";
import { DEVICE_PRESETS, normalizeDevice, type BrowserName, type DevicePreset } from "@/lib/studio-types";
import type { TextBox } from "@/lib/types";

export function cssTargetSelector(targetId: string) {
  const trimmed = targetId.trim();
  if (!trimmed) throw new Error("Target ID is required.");
  if (trimmed.startsWith("#") || trimmed.startsWith(".") || trimmed.includes("[")) {
    return trimmed;
  }
  return `#${trimmed}`;
}

async function extractBoxes(page: Page, selector: string): Promise<TextBox[]> {
  return page.locator(selector).first().evaluate((el) => {
    const rootRect = el.getBoundingClientRect();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const boxes: TextBox[] = [];

    let node = walker.nextNode();
    while (node) {
      const text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (text) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width >= 1 && rect.height >= 1) {
            boxes.push({
              text,
              x: rect.left - rootRect.left,
              y: rect.top - rootRect.top,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      }
      node = walker.nextNode();
    }

    return boxes;
  });
}

const launchOptions = {
  headless: true,
  args: ["--disable-dev-shm-usage"] as string[],
};

export async function launchNamedBrowser(name: BrowserName): Promise<Browser> {
  if (name === "firefox") {
    try {
      return await firefox.launch({ headless: true });
    } catch {
      throw new Error(
        "Firefox is not installed. Run npm run playwright:install then retry.",
      );
    }
  }
  if (name === "webkit") {
    try {
      return await webkit.launch({ headless: true });
    } catch {
      throw new Error(
        "WebKit is not installed. Run npm run playwright:install then retry.",
      );
    }
  }

  try {
    return await chromium.launch(launchOptions);
  } catch {
    try {
      return await chromium.launch({ ...launchOptions, channel: "chrome" });
    } catch {
      return await chromium.launch({ ...launchOptions, channel: "msedge" });
    }
  }
}

export function deviceContextOptions(device: DevicePreset) {
  const id = normalizeDevice(device);
  const preset =
    DEVICE_PRESETS.find((item) => item.id === id) ?? DEVICE_PRESETS[0];
  return {
    viewport: { width: preset.width, height: preset.height },
    deviceScaleFactor: 1,
  };
}

export async function withBrowser<T>(
  run: (page: Page) => Promise<T>,
  options?: { browser?: BrowserName; device?: DevicePreset },
) {
  const browser = await launchNamedBrowser(options?.browser ?? "chromium");
  try {
    const context = await browser.newContext(
      deviceContextOptions(options?.device ?? "1920x900"),
    );
    const page = await context.newPage();
    return await run(page);
  } finally {
    await browser.close();
  }
}

export async function waitForPageReady(
  page: Page,
  options?: {
    settleMs?: number;
  },
) {
  // Always wait for intro animations to finish before capture.
  const settleMs = Math.max(0, Math.min(options?.settleMs ?? 0, 30_000));

  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(async () => {
    const quietMs = 500;
    const deadline = Date.now() + 25_000;

    const collect = () => {
      const root = document.documentElement as HTMLElement & {
        getAnimations?: (opts?: { subtree?: boolean }) => Animation[];
      };
      return typeof root.getAnimations === "function"
        ? root.getAnimations({ subtree: true })
        : document.getAnimations();
    };

    const isFiniteRunning = (animation: Animation) => {
      const iterations = animation.effect?.getComputedTiming().iterations ?? 1;
      if (iterations === Infinity) return false;
      return animation.playState === "running" || animation.pending;
    };

    while (Date.now() < deadline) {
      const running = collect().filter(isFiniteRunning);
      if (running.length === 0) {
        // Quiet window: no new finite animations should start.
        await new Promise((resolve) => setTimeout(resolve, quietMs));
        if (collect().filter(isFiniteRunning).length === 0) return;
        continue;
      }

      await Promise.all(
        running.map((animation) => animation.finished.catch(() => undefined)),
      );
    }
  });

  // Wait for images that may appear after the intro.
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }),
    );
  });

  if (settleMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, settleMs));
  }
}

export async function captureSelector(
  page: Page,
  url: string,
  selector: string,
  options?: {
    settleMs?: number;
    waitForAnimations?: boolean;
  },
) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 }).catch(async () => {
    // Some sites never go fully idle (analytics). Fall back to load.
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
  });
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: "visible", timeout: 20_000 });

  // Always wait until animations are fully settled before screenshot.
  await waitForPageReady(page, {
    settleMs: options?.settleMs ?? 0,
  });

  const boxes = await extractBoxes(page, selector);
  const buffer = Buffer.from(
    await loc.screenshot({ type: "png", animations: "disabled" }),
  );
  const size = await loc.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  return { buffer, boxes, size };
}
