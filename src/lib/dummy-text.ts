import type { TextBox, WhitelistItem } from "@/lib/types";

const DUMMY_PATTERNS: RegExp[] = [
  /\blorem\b/i,
  /\bipsum\b/i,
  /\bdolor sit amet\b/i,
  /\bconsectetur\b/i,
  /\badipiscing\b/i,
  /\bplaceholder\b/i,
  /\bproduct name\b/i,
  /\bcompany name\b/i,
  /\byour (brand|title|headline|name)\b/i,
  /\bheadline goes here\b/i,
  /\bcard title\b/i,
  /\bsubtitle goes here\b/i,
  /\buser name\b/i,
  /\bjohn doe\b/i,
  /\bjane (doe|smith)\b/i,
  /\balex smith\b/i,
  /\bacme(\s+corp)?\b/i,
  /\bexample\.(com|org|net)\b/i,
  /\bfoo@bar\b/i,
  /\b555[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /^\$?99([.,]99)?$/,
  /^\$0\.00$/,
  /\bxxx+\b/i,
  /\bn\/a\b/i,
  /\bsample (text|data|user)\b/i,
  /\bdummy\b/i,
  /\bcoming soon\b/i,
];

export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function isDummyText(value: string) {
  const text = normalizeText(value);
  if (!text) return false;
  return DUMMY_PATTERNS.some((pattern) => pattern.test(text));
}

function center(box: TextBox) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function normalizedDistance(
  a: TextBox,
  b: TextBox,
  width: number,
  height: number,
) {
  const ac = center(a);
  const bc = center(b);
  const dx = (ac.x - bc.x) / Math.max(width, 1);
  const dy = (ac.y - bc.y) / Math.max(height, 1);
  return Math.hypot(dx, dy);
}

function scaleBoxes(
  boxes: TextBox[],
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number,
) {
  const sx = toWidth / Math.max(fromWidth, 1);
  const sy = toHeight / Math.max(fromHeight, 1);
  return boxes.map((box) => ({
    ...box,
    x: box.x * sx,
    y: box.y * sy,
    width: box.width * sx,
    height: box.height * sy,
  }));
}

export function buildWhitelist(options: {
  designBoxes: TextBox[];
  liveBoxes: TextBox[];
  designSize: { width: number; height: number };
  liveSize: { width: number; height: number };
  compareSize: { width: number; height: number };
}): WhitelistItem[] {
  const design = scaleBoxes(
    options.designBoxes,
    options.designSize.width,
    options.designSize.height,
    options.compareSize.width,
    options.compareSize.height,
  );
  const live = scaleBoxes(
    options.liveBoxes,
    options.liveSize.width,
    options.liveSize.height,
    options.compareSize.width,
    options.compareSize.height,
  );

  const usedLive = new Set<number>();
  const items: WhitelistItem[] = [];

  for (const designBox of design) {
    let bestIndex = -1;
    let bestDistance = Infinity;

    live.forEach((liveBox, index) => {
      if (usedLive.has(index)) return;
      const distance = normalizedDistance(
        designBox,
        liveBox,
        options.compareSize.width,
        options.compareSize.height,
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const matched = bestIndex >= 0 && bestDistance < 0.08 ? live[bestIndex] : null;
    if (matched) usedLive.add(bestIndex);

    const dummy = isDummyText(designBox.text);
    const mismatch =
      matched !== null &&
      normalizeText(designBox.text) !== normalizeText(matched.text);

    if (!dummy && !mismatch) continue;

    items.push({
      designText: designBox.text,
      liveText: matched?.text ?? null,
      reason: dummy ? "dummy-pattern" : "content-mismatch",
      box: designBox,
    });

    if (matched && mismatch) {
      items.push({
        designText: designBox.text,
        liveText: matched.text,
        reason: "content-mismatch",
        box: matched,
      });
    }
  }

  return items;
}

export function uniqueWhitelist(items: WhitelistItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.reason}|${normalizeText(item.designText)}|${normalizeText(item.liveText ?? "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
