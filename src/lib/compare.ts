import { fetchFigmaSection, parseFigmaUrl } from "@/lib/figma";
import { captureSelector, cssTargetSelector, withBrowser } from "@/lib/capture";
import { buildWhitelist, uniqueWhitelist } from "@/lib/dummy-text";
import {
  accuracyFromDiff,
  applyTextMasks,
  diffPngs,
  pngFromBuffer,
  pngToDataUrl,
  resizePng,
} from "@/lib/image-compare";
import type { CompareRequest, CompareResponse, TextBox } from "@/lib/types";

function assertHttpUrl(value: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL.`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${label} must start with http:// or https://.`);
  }
  return parsed.toString();
}

export async function runVisualCompare(
  input: CompareRequest,
): Promise<CompareResponse> {
  const webpageUrl = assertHttpUrl(input.webpageUrl, "Webpage URL");
  const figmaUrl = assertHttpUrl(input.figmaUrl, "Figma URL");
  const selector = cssTargetSelector(input.targetId);
  const warnings: string[] = [];
  const figma = parseFigmaUrl(figmaUrl);
  const token = process.env.FIGMA_ACCESS_TOKEN?.trim();

  const liveCapture = await withBrowser((page) =>
    captureSelector(page, webpageUrl, selector, {
      settleMs: input.settleMs,
    }),
  );

  let designBuffer: Buffer;
  let designBoxes: TextBox[];
  let designSize: { width: number; height: number };
  let source: CompareResponse["source"];

  if (figma) {
    if (!token) {
      throw new Error(
        "This looks like a Figma file link. Set FIGMA_ACCESS_TOKEN in .env.local, or paste a public page that renders the design (try /demo/figma).",
      );
    }
    const exported = await fetchFigmaSection(figmaUrl, token);
    designBuffer = exported.buffer;
    designBoxes = exported.boxes;
    designSize = exported.size;
    source = "figma-api";
  } else {
    const designCapture = await withBrowser((page) =>
      captureSelector(page, figmaUrl, selector, {
        settleMs: input.settleMs,
      }),
    );
    designBuffer = designCapture.buffer;
    designBoxes = designCapture.boxes;
    designSize = designCapture.size;
    source = "design-page";
    warnings.push(
      "Compared against a design webpage (not the Figma API). For a real Figma file, use a node link and FIGMA_ACCESS_TOKEN.",
    );
  }

  const livePng = pngFromBuffer(liveCapture.buffer);
  const designPng = pngFromBuffer(designBuffer);

  const width = designPng.width;
  const height = designPng.height;
  const liveFitted =
    livePng.width === width && livePng.height === height
      ? livePng
      : resizePng(livePng, width, height);

  if (
    Math.abs(livePng.width / livePng.height - width / height) > 0.08
  ) {
    warnings.push(
      "The webpage section and design have different aspect ratios, so layout pixels may still differ after dummy text is masked.",
    );
  }

  const whitelist = buildWhitelist({
    designBoxes,
    liveBoxes: liveCapture.boxes,
    designSize: { width: designPng.width, height: designPng.height },
    liveSize: { width: livePng.width, height: livePng.height },
    compareSize: { width, height },
  });

  const maskBoxes = whitelist.map((item) => item.box);
  const maskedLive = applyTextMasks(liveFitted, maskBoxes);
  const maskedDesign = applyTextMasks(designPng, maskBoxes);

  const raw = diffPngs(liveFitted, designPng);
  const masked = diffPngs(maskedLive, maskedDesign);

  return {
    accuracyRaw: accuracyFromDiff(raw.mismatched, raw.total),
    accuracyWhitelisted: accuracyFromDiff(masked.mismatched, masked.total),
    diffPixelsRaw: raw.mismatched,
    diffPixelsWhitelisted: masked.mismatched,
    totalPixels: masked.total,
    whitelist: uniqueWhitelist(whitelist),
    webpageImage: pngToDataUrl(liveFitted),
    designImage: pngToDataUrl(designPng),
    diffImageRaw: pngToDataUrl(raw.diff),
    diffImageWhitelisted: pngToDataUrl(masked.diff),
    source,
    warnings,
  };
}
