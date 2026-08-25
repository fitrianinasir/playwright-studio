import { jsonError, originFrom } from "@/lib/api";
import { addRun, getScenario, updateRun } from "@/lib/store";
import { runScenario } from "@/lib/runner";
import type { BrowserName, DevicePreset, TestRun } from "@/lib/studio-types";

type Ctx = { params: Promise<{ scenarioId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { scenarioId } = await ctx.params;
  const scenario = getScenario(scenarioId);
  if (!scenario) return jsonError("Scenario not found.", 404);

  const body = (await request.json().catch(() => ({}))) as {
    browsers?: BrowserName[];
    device?: DevicePreset;
    baseUrl?: string;
  };

  const logs: string[] = [];
  const run: TestRun = {
    id: `run_${crypto.randomUUID().slice(0, 8)}`,
    projectId: scenario.projectId,
    scenarioId: scenario.id,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    browsers: body.browsers?.length ? body.browsers : scenario.browsers,
    device: body.device ?? scenario.device,
    results: [],
    logs,
  };
  addRun(run);

  try {
    const executed = await runScenario({
      scenario,
      browsers: run.browsers,
      device: run.device,
      baseUrl: originFrom(request, body.baseUrl),
      onLog: (line) => logs.push(`${new Date().toISOString()} ${line}`),
    });
    const finished =
      updateRun(run.id, {
        results: executed.results,
        status: executed.status,
        finishedAt: new Date().toISOString(),
        logs: [...logs],
      }) ?? run;
    return Response.json({ run: finished });
  } catch (err) {
    logs.push(err instanceof Error ? err.message : "Run failed.");
    const finished =
      updateRun(run.id, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        logs: [...logs],
      }) ?? run;
    return Response.json({ run: finished, error: logs.at(-1) }, { status: 500 });
  }
}
