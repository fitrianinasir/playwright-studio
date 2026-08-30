import { jsonError, originFrom } from "@/lib/api";
import { addRun, getRun, getScenario, updateRun } from "@/lib/store";
import { runScenario } from "@/lib/runner";
import type { BrowserName, DevicePreset, TestRun } from "@/lib/studio-types";
import { after } from "next/server";

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

  const baseUrl = originFrom(request, body.baseUrl);
  after(async () => {
    try {
      const executed = await runScenario({
        scenario,
        browsers: run.browsers,
        device: run.device,
        baseUrl,
        onLog: (line) => logs.push(`${new Date().toISOString()} ${line}`),
        onBrowserSteps: (browser, steps) => {
          const existing = getRun(run.id);
          const others =
            existing?.results.filter((result) => result.browser !== browser) ?? [];
          const failed = steps.some((step) => step.status === "failed");
          updateRun(run.id, {
            results: [
              ...others,
              {
                browser,
                status: failed ? "failed" : "passed",
                steps,
              },
            ],
            logs: [...logs],
          });
        },
      });
      updateRun(run.id, {
        results: executed.results,
        status: executed.status,
        finishedAt: new Date().toISOString(),
        logs: [...logs],
      });
    } catch (err) {
      logs.push(err instanceof Error ? err.message : "Run failed.");
      updateRun(run.id, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        logs: [...logs],
      });
    }
  });

  return Response.json({ run });
}
