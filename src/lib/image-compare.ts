import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import type { TextBox } from "@/lib/types";

const MASK_COLOR = [148, 163, 184, 255] as const;

export function pngFromBuffer(buffer: Buffer) {
  return PNG.sync.read(buffer);
}

export function pngToDataUrl(png: PNG) {
  return `data:image/png;base64,${PNG.sync.write(png).toString("base64")}`;
}

export function resizePng(source: PNG, width: number, height: number) {
  const dest = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    const srcY = Math.min(source.height - 1, Math.floor((y * source.height) / height));
    for (let x = 0; x < width; x += 1) {
      const srcX = Math.min(source.width - 1, Math.floor((x * source.width) / width));
      const srcIdx = (source.width * srcY + srcX) << 2;
      const destIdx = (width * y + x) << 2;
      dest.data[destIdx] = source.data[srcIdx];
      dest.data[destIdx + 1] = source.data[srcIdx + 1];
      dest.data[destIdx + 2] = source.data[srcIdx + 2];
      dest.data[destIdx + 3] = source.data[srcIdx + 3];
    }
  }
  return dest;
}

function clonePng(source: PNG) {
  const copy = new PNG({ width: source.width, height: source.height });
  copy.data.set(source.data);
  return copy;
}

export function applyTextMasks(source: PNG, boxes: TextBox[], padding = 6) {
  const masked = clonePng(source);
  for (const box of boxes) {
    const left = Math.max(0, Math.floor(box.x - padding));
    const top = Math.max(0, Math.floor(box.y - padding));
    const right = Math.min(source.width, Math.ceil(box.x + box.width + padding));
    const bottom = Math.min(source.height, Math.ceil(box.y + box.height + padding));

    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const idx = (source.width * y + x) << 2;
        masked.data[idx] = MASK_COLOR[0];
        masked.data[idx + 1] = MASK_COLOR[1];
        masked.data[idx + 2] = MASK_COLOR[2];
        masked.data[idx + 3] = MASK_COLOR[3];
      }
    }
  }
  return masked;
}

export function diffPngs(a: PNG, b: PNG) {
  const width = a.width;
  const height = a.height;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(a.data, b.data, diff.data, width, height, {
    threshold: 0.12,
    includeAA: false,
  });
  return { diff, mismatched, total: width * height };
}

export function accuracyFromDiff(mismatched: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (1 - mismatched / total) * 100));
}
