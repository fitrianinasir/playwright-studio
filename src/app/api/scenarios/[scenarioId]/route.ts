import { jsonError } from "@/lib/api";
import { deleteScenario, getScenario, updateScenario } from "@/lib/store";
import type { BrowserName, DevicePreset, ScenarioStep } from "@/lib/studio-types";

type Ctx = { params: Promise<{ scenarioId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  const scenario = getScenario(scenarioId);
  if (!scenario) return jsonError("Scenario not found.", 404);
  return Response.json({ scenario });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  if (!getScenario(scenarioId)) return jsonError("Scenario not found.", 404);
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    steps?: ScenarioStep[];
    browsers?: BrowserName[];
    device?: DevicePreset;
  };
  return Response.json({ scenario: updateScenario(scenarioId, body) });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  if (!getScenario(scenarioId)) return jsonError("Scenario not found.", 404);
  deleteScenario(scenarioId);
  return Response.json({ ok: true });
}
