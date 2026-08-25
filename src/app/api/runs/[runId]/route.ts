import { jsonError } from "@/lib/api";
import { getRun, getScenario, saveBaseline } from "@/lib/store";

type Ctx = { params: Promise<{ runId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { runId } = await ctx.params;
  const run = getRun(runId);
  if (!run) return jsonError("Run not found.", 404);
  return Response.json({ run, scenario: getScenario(run.scenarioId) });
}

export async function POST(request: Request, ctx: Ctx) {
  const { runId } = await ctx.params;
  const run = getRun(runId);
  if (!run) return jsonError("Run not found.", 404);
  const body = (await request.json()) as {
    browser?: string;
    snapshotName?: string;
    image?: string;
  };
  const browserResult =
    run.results.find((result) => result.browser === body.browser) ?? run.results[0];
  const step =
    browserResult?.steps.find(
      (item) => item.name === body.snapshotName && item.screenshot,
    ) ?? browserResult?.steps.find((item) => item.screenshot);
  const image = body.image || step?.screenshot;
  if (!image || !browserResult) return jsonError("No screenshot to promote.");
  const baseline = saveBaseline({
    projectId: run.projectId,
    scenarioId: run.scenarioId,
    snapshotName: body.snapshotName || step?.name || "snapshot",
    browser: browserResult.browser,
    device: run.device,
    image,
  });
  return Response.json({ baseline });
}
