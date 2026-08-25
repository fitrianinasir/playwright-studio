import { jsonError } from "@/lib/api";
import {
  clearBaselinesForScenario,
  deleteBaseline,
  getScenario,
  listBaselines,
} from "@/lib/store";

type Ctx = { params: Promise<{ scenarioId: string }> };

function scenarioBaselines(scenarioId: string) {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;
  return listBaselines(scenario.projectId).filter(
    (baseline) => baseline.scenarioId === scenarioId,
  );
}

export async function GET(_request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  const baselines = scenarioBaselines(scenarioId);
  if (!baselines) return jsonError("Scenario not found.", 404);
  return Response.json({ baselines });
}

export async function POST(request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  if (!getScenario(scenarioId)) return jsonError("Scenario not found.", 404);

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    baselineId?: string;
  };

  if (body.action === "delete-one") {
    const baselineId = body.baselineId?.trim() ?? "";
    if (!baselineId) return jsonError("baselineId is required.");
    const baselines = scenarioBaselines(scenarioId) ?? [];
    const match = baselines.find((baseline) => baseline.id === baselineId);
    if (!match) return jsonError("Baseline not found for this scenario.", 404);
    deleteBaseline(baselineId);
    return Response.json({ ok: true, cleared: 1, baselineId });
  }

  if (body.action === "clear-all") {
    const cleared = clearBaselinesForScenario(scenarioId);
    return Response.json({ ok: true, cleared });
  }

  return jsonError('Unknown action. Use "delete-one" or "clear-all".');
}

export async function DELETE(request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  if (!getScenario(scenarioId)) return jsonError("Scenario not found.", 404);

  const baselineId = new URL(request.url).searchParams.get("baselineId")?.trim();
  if (baselineId) {
    const baselines = scenarioBaselines(scenarioId) ?? [];
    const match = baselines.find((baseline) => baseline.id === baselineId);
    if (!match) return jsonError("Baseline not found for this scenario.", 404);
    deleteBaseline(baselineId);
    return Response.json({ ok: true, cleared: 1, baselineId });
  }

  const cleared = clearBaselinesForScenario(scenarioId);
  return Response.json({ ok: true, cleared });
}
