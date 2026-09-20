import type { NextApiRequest, NextApiResponse } from "next";
import { jsonError, methodNotAllowed } from "@/lib/api";
import { runVisualCompare } from "@/lib/compare";
import type { CompareRequest } from "@/lib/types";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
  maxDuration: 60,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (methodNotAllowed(req, res, ["POST"])) return;

  try {
    const body = (req.body ?? {}) as Partial<CompareRequest>;
    const webpageUrl = body.webpageUrl?.trim() ?? "";
    const targetId = body.targetId?.trim() ?? "";
    const figmaUrl = body.figmaUrl?.trim() ?? "";
    const settleMs =
      typeof body.settleMs === "number" && Number.isFinite(body.settleMs)
        ? body.settleMs
        : undefined;

    if (!webpageUrl || !targetId || !figmaUrl) {
      jsonError(res, "Webpage URL, target ID, and Figma URL are required.");
      return;
    }

    const result = await runVisualCompare({
      webpageUrl,
      targetId,
      figmaUrl,
      settleMs,
    });
    res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Visual compare failed.";
    jsonError(res, message, 500);
  }
}
