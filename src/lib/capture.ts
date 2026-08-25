import {
  chromium,
  firefox,
  webkit,
  devices,
  type Browser,
  type Page,
} from "playwright";
import type { BrowserName, DevicePreset } from "@/lib/studio-types";
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
  if (device === "iphone-14") return devices["iPhone 14"];
  if (device === "pixel-7") return devices["Pixel 7"];
  return {
    viewport: { width: 1280, height: 900 },
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
      deviceContextOptions(options?.device ?? "desktop"),
    );
    const page = await context.newPage();
    return await run(page);
  } finally {
    await browser.close();
  }
}

export async function captureSelector(page: Page, url: string, selector: string) {
  await page.goto(url, { waitUntil: "load", timeout: 30_000 });
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: "visible", timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);

  const boxes = await extractBoxes(page, selector);
  const buffer = Buffer.from(await loc.screenshot({ type: "png" }));
  const size = await loc.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  return { buffer, boxes, size };
}
