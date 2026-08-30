import type { Page } from "playwright";
import { runVisualCompare } from "@/lib/compare";
import {
  deviceContextOptions,
  launchNamedBrowser,
} from "@/lib/capture";
import {
  accuracyFromDiff,
  diffPngs,
  pngFromBuffer,
  pngToDataUrl,
  resizePng,
} from "@/lib/image-compare";
import { findBaseline, saveBaseline } from "@/lib/store";
import type {
  BrowserName,
  BrowserRunResult,
  DevicePreset,
  Scenario,
  ScenarioStep,
  StepResult,
} from "@/lib/studio-types";

function resolveUrl(url: string, baseUrl: string) {
  const trimmed = url.trim();
  if (!trimmed) return baseUrl;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

function required(step: ScenarioStep, key: string) {
  const value = step.params[key]?.trim() ?? "";
  if (!value) throw new Error(`${step.name}: "${key}" is required.`);
  return value;
}

/** Wait until navigations and in-flight requests finish before the next step. */
async function waitForPageSettled(page: Page) {
  await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
}

function parseWaitMs(value: string | undefined, fallback = 5_000) {
  const parsed = Number(value?.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, 60_000);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function clickSecondPopupButton(page: Page) {
  const roots = [
    page.getByRole("dialog"),
    page.getByRole("alertdialog"),
    page.locator("[data-slot='dialog-content']"),
  ];
  for (const root of roots) {
    const dialog = root.first();
    const visible = await dialog.isVisible().catch(() => false);
    if (!visible) continue;
    const buttons = dialog.locator(
      'button:visible, input[type="button"]:visible, input[type="submit"]:visible, [role="button"]:visible',
    );
    const count = await buttons.count();
    if (count < 2) continue;
    await buttons.nth(1).click();
    return true;
  }
  return false;
}

async function captureStepScreenshot(page: Page, selector?: string) {
  if (selector?.trim()) {
    const loc = page.locator(selector).first();
    await loc.waitFor({ state: "visible", timeout: 10_000 });
    return Buffer.from(await loc.screenshot({ type: "png" }));
  }
  return Buffer.from(await page.screenshot({ type: "png", fullPage: false }));
}

async function compareToBaseline(input: {
  projectId: string;
  scenarioId: string;
  snapshotName: string;
  browser: BrowserName;
  device: DevicePreset;
  image: Buffer;
}): Promise<Pick<StepResult, "screenshot" | "baseline" | "diff" | "accuracy" | "log">> {
  const screenshot = `data:image/png;base64,${input.image.toString("base64")}`;
  const existing = findBaseline(input);
  if (!existing) {
    saveBaseline({ ...input, image: screenshot });
    return {
      screenshot,
      baseline: screenshot,
      accuracy: 100,
      log: "No baseline yet — this capture was saved as the baseline.",
    };
  }

  const livePng = pngFromBuffer(input.image);
  const rawBase = pngFromBuffer(Buffer.from(existing.image.split(",")[1] ?? "", "base64"));
  const basePng =
    rawBase.width === livePng.width && rawBase.height === livePng.height
      ? rawBase
      : resizePng(rawBase, livePng.width, livePng.height);
  const { diff, mismatched, total } = diffPngs(livePng, basePng);
  const accuracy = accuracyFromDiff(mismatched, total);
  return {
    screenshot,
    baseline: existing.image,
    diff: pngToDataUrl(diff),
    accuracy,
    log: `Matched baseline at ${accuracy.toFixed(1)}% (${mismatched} differing pixels).`,
  };
}

async function runStep(
  page: Page,
  step: ScenarioStep,
  ctx: {
    baseUrl: string;
    projectId: string;
    scenarioId: string;
    browser: BrowserName;
    device: DevicePreset;
  },
): Promise<Omit<StepResult, "durationMs">> {
  switch (step.kind) {
    case "navigate": {
      const url = resolveUrl(required(step, "url"), ctx.baseUrl);
      await page.goto(url, { waitUntil: "load", timeout: 30_000 });
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Opened ${url}` };
    }
    case "login": {
      const corporateIdSelector = required(step, "corporateIdSelector");
      const userIdSelector = required(step, "userIdSelector");
      const keybcaSelector = required(step, "keybcaSelector");
      await page.locator(corporateIdSelector).fill(required(step, "corporateId"));
      await page.locator(userIdSelector).fill(required(step, "userId"));
      await page.locator(keybcaSelector).fill(required(step, "keybca"));
      await page.locator(required(step, "submitSelector")).click();
      const popupWaitMs = parseWaitMs(step.params.popupWaitMs);
      await sleep(popupWaitMs);

      let confirmLog = "no session popup";
      const clickedPopup = await clickSecondPopupButton(page);
      if (clickedPopup) {
        await sleep(popupWaitMs);
        await waitForPageSettled(page);
        confirmLog = "clicked second popup button, waited for home";
      } else {
        await waitForPageSettled(page);
      }

      return {
        stepId: step.id,
        name: step.name,
        kind: step.kind,
        status: "passed",
        log: `Submitted login via ${corporateIdSelector}, ${userIdSelector}, ${keybcaSelector}; ${confirmLog}`,
      };
    }
    case "fill": {
      await page.locator(required(step, "selector")).fill(step.params.value ?? "");
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Filled ${step.params.selector}` };
    }
    case "click": {
      await page.locator(required(step, "selector")).click();
      await waitForPageSettled(page);
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Clicked ${step.params.selector}` };
    }
    case "hover": {
      await page.locator(required(step, "selector")).hover();
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Hovered ${step.params.selector}` };
    }
    case "selectOption": {
      await page.locator(required(step, "selector")).selectOption(required(step, "value"));
      await waitForPageSettled(page);
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Selected ${step.params.value}` };
    }
    case "wait": {
      const mode = (step.params.mode || "timeout").trim();
      const value = required(step, "value");
      if (mode === "selector") {
        await page.locator(value).first().waitFor({ state: "visible", timeout: 15_000 });
        return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Waited for ${value}` };
      }
      await new Promise((resolve) => setTimeout(resolve, Number(value) || 0));
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Waited ${value}ms` };
    }
    case "assertText": {
      const text = await page.locator(required(step, "selector")).innerText();
      const expected = required(step, "text");
      if (!text.includes(expected)) {
        throw new Error(`Expected "${expected}" in ${step.params.selector}, got "${text.slice(0, 180)}"`);
      }
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `Found "${expected}"` };
    }
    case "assertVisible": {
      await page.locator(required(step, "selector")).first().waitFor({ state: "visible", timeout: 10_000 });
      return { stepId: step.id, name: step.name, kind: step.kind, status: "passed", log: `${step.params.selector} is visible` };
    }
    case "screenshot": {
      const name = required(step, "name");
      const buffer = await captureStepScreenshot(page, step.params.selector);
      const compared = await compareToBaseline({
        projectId: ctx.projectId,
        scenarioId: ctx.scenarioId,
        snapshotName: name,
        browser: ctx.browser,
        device: ctx.device,
        image: buffer,
      });
      const failed = (compared.accuracy ?? 100) < 98;
      return {
        stepId: step.id,
        name: step.name,
        kind: step.kind,
        status: failed ? "failed" : "passed",
        ...compared,
        error: failed
          ? `Visual regression below 98% (${compared.accuracy?.toFixed(1)}%).`
          : undefined,
      };
    }
    case "visualCompare": {
      const current = page.url() || ctx.baseUrl;
      const webpageUrl = resolveUrl(step.params.webpageUrl || current, ctx.baseUrl);
      const figmaUrl = resolveUrl(required(step, "figmaUrl"), ctx.baseUrl);
      const result = await runVisualCompare({
        webpageUrl,
        targetId: required(step, "targetId"),
        figmaUrl,
        settleMs: Number(step.params.settleMs) || 0,
      });
      const failed = result.accuracyWhitelisted < 90;
      return {
        stepId: step.id,
        name: step.name,
        kind: step.kind,
        status: failed ? "failed" : "passed",
        screenshot: result.webpageImage,
        baseline: result.designImage,
        diff: result.diffImageWhitelisted,
        accuracy: result.accuracyWhitelisted,
        log: `Figma compare ${result.accuracyWhitelisted.toFixed(1)}% after dummy whitelist (${result.whitelist.length} regions).`,
        error: failed
          ? `Figma visual accuracy ${result.accuracyWhitelisted.toFixed(1)}% is under 90%.`
          : undefined,
      };
    }
    default:
      throw new Error(`Unknown action: ${step.kind}`);
  }
}

export async function runScenarioOnBrowser(input: {
  scenario: Scenario;
  browser: BrowserName;
  device: DevicePreset;
  baseUrl: string;
  onSteps?: (steps: StepResult[]) => void;
}): Promise<BrowserRunResult> {
  const browser = await launchNamedBrowser(input.browser);
  const logs: StepResult[] = [];
  try {
    const context = await browser.newContext(deviceContextOptions(input.device));
    const page = await context.newPage();
    let failed = false;

    for (const step of input.scenario.steps) {
      if (failed) {
        logs.push({
          stepId: step.id,
          name: step.name,
          kind: step.kind,
          status: "skipped",
          durationMs: 0,
          log: "Skipped after a previous failure.",
        });
        input.onSteps?.([...logs]);
        continue;
      }
      const started = Date.now();
      try {
        const result = await runStep(page, step, {
          baseUrl: input.baseUrl,
          projectId: input.scenario.projectId,
          scenarioId: input.scenario.id,
          browser: input.browser,
          device: input.device,
        });
        await waitForPageSettled(page);
        const extraWaitMs = parseWaitMs(step.params.waitMs, 0);
        if (extraWaitMs > 0) await sleep(extraWaitMs);
        logs.push({
          ...result,
          durationMs: Date.now() - started,
          log:
            extraWaitMs > 0 ? `${result.log}; waited ${extraWaitMs}ms` : result.log,
        });
        input.onSteps?.([...logs]);
        if (result.status === "failed") failed = true;
      } catch (error) {
        failed = true;
        logs.push({
          stepId: step.id,
          name: step.name,
          kind: step.kind,
          status: "failed",
          durationMs: Date.now() - started,
          log: "Step threw.",
          error: error instanceof Error ? error.message : "Step failed.",
        });
        input.onSteps?.([...logs]);
      }
    }

    return {
      browser: input.browser,
      status: failed ? "failed" : "passed",
      steps: logs,
    };
  } finally {
    await browser.close();
  }
}

export async function runScenario(input: {
  scenario: Scenario;
  browsers?: BrowserName[];
  device?: DevicePreset;
  baseUrl: string;
  onLog?: (line: string) => void;
  onBrowserSteps?: (browser: BrowserName, steps: StepResult[]) => void;
}) {
  const browsers = input.browsers?.length ? input.browsers : input.scenario.browsers;
  const device = input.device ?? input.scenario.device;
  const results: BrowserRunResult[] = [];

  for (const browser of browsers) {
    input.onLog?.(`Starting ${browser} (${device})`);
    const result = await runScenarioOnBrowser({
      scenario: input.scenario,
      browser,
      device,
      baseUrl: input.baseUrl,
      onSteps: (steps) => input.onBrowserSteps?.(browser, steps),
    });
    results.push(result);
    input.onLog?.(
      `${browser} ${result.status} — ${result.steps.filter((s) => s.status === "passed").length}/${result.steps.length} steps passed`,
    );
  }

  const status: "passed" | "failed" = results.every((result) => result.status === "passed")
    ? "passed"
    : "failed";
  return { results, status, browsers, device };
}
