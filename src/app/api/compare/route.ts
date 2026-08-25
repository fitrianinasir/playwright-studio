import { runVisualCompare } from "@/lib/compare";
import type { CompareRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CompareRequest>;
    const webpageUrl = body.webpageUrl?.trim() ?? "";
    const targetId = body.targetId?.trim() ?? "";
    const figmaUrl = body.figmaUrl?.trim() ?? "";

    if (!webpageUrl || !targetId || !figmaUrl) {
      return Response.json(
        { error: "Webpage URL, target ID, and Figma URL are required." },
        { status: 400 },
      );
    }

    const result = await runVisualCompare({ webpageUrl, targetId, figmaUrl });
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Visual compare failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
