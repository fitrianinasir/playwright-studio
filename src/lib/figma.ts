import { PNG } from "pngjs";
import type { TextBox } from "@/lib/types";

export type ParsedFigmaUrl = {
  fileKey: string;
  nodeId: string | null;
};

type FigmaBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FigmaNode = {
  type?: string;
  characters?: string;
  absoluteBoundingBox?: FigmaBox;
  children?: FigmaNode[];
};

export function parseFigmaUrl(url: string): ParsedFigmaUrl | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("figma.com")) return null;

    const parts = parsed.pathname.split("/").filter(Boolean);
    const kindIndex = parts.findIndex((part) =>
      ["design", "file", "proto", "board"].includes(part),
    );
    const fileKey = kindIndex >= 0 ? parts[kindIndex + 1] : null;
    if (!fileKey) return null;

    const rawNode = parsed.searchParams.get("node-id");
    const nodeId = rawNode ? rawNode.replace(/-/g, ":") : null;

    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

function walkText(node: FigmaNode, acc: { text: string; box: FigmaBox }[]) {
  if (node.type === "TEXT" && node.characters && node.absoluteBoundingBox) {
    acc.push({ text: node.characters, box: node.absoluteBoundingBox });
  }
  for (const child of node.children ?? []) walkText(child, acc);
}

export async function fetchFigmaSection(url: string, token: string) {
  const parsed = parseFigmaUrl(url);
  if (!parsed?.nodeId) {
    throw new Error(
      "Figma URL must include a node-id query (select the frame/section in Figma, then copy the link).",
    );
  }

  const headers = { "X-Figma-Token": token };
  const ids = encodeURIComponent(parsed.nodeId);

  const [imageRes, nodesRes] = await Promise.all([
    fetch(
      `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${ids}&format=png&scale=2`,
      { headers },
    ),
    fetch(
      `https://api.figma.com/v1/files/${parsed.fileKey}/nodes?ids=${ids}`,
      { headers },
    ),
  ]);

  if (!imageRes.ok) {
    throw new Error(`Figma image export failed (${imageRes.status}). Check the file access and token.`);
  }
  if (!nodesRes.ok) {
    throw new Error(`Figma node fetch failed (${nodesRes.status}). Check the file access and token.`);
  }

  const imageJson = (await imageRes.json()) as {
    images?: Record<string, string | null>;
    err?: string;
  };
  const imageUrl = imageJson.images?.[parsed.nodeId];
  if (!imageUrl) {
    throw new Error(imageJson.err || "Figma did not return an image for that node.");
  }

  const nodesJson = (await nodesRes.json()) as {
    nodes?: Record<string, { document?: FigmaNode }>;
  };
  const document = nodesJson.nodes?.[parsed.nodeId]?.document;
  if (!document?.absoluteBoundingBox) {
    throw new Error("Could not read the selected Figma section bounds.");
  }

  const root = document.absoluteBoundingBox;
  const texts: { text: string; box: FigmaBox }[] = [];
  walkText(document, texts);

  const pngRes = await fetch(imageUrl);
  if (!pngRes.ok) throw new Error("Failed to download the exported Figma PNG.");
  const buffer = Buffer.from(await pngRes.arrayBuffer());
  const png = PNG.sync.read(buffer);
  const sx = png.width / Math.max(root.width, 1);
  const sy = png.height / Math.max(root.height, 1);

  const boxes: TextBox[] = texts.map(({ text, box }) => ({
    text,
    x: (box.x - root.x) * sx,
    y: (box.y - root.y) * sy,
    width: box.width * sx,
    height: box.height * sy,
  }));

  return {
    buffer,
    boxes,
    size: { width: png.width, height: png.height },
  };
}
