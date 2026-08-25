import { jsonError } from "@/lib/api";
import { buildHtmlReport } from "@/lib/report-html";
import { getProject, getRun, getScenario } from "@/lib/store";

type Ctx = { params: Promise<{ runId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { runId } = await ctx.params;
  const run = getRun(runId);
  if (!run) return jsonError("Run not found.", 404);
  const project = getProject(run.projectId);
  const scenario = getScenario(run.scenarioId);
  const html = buildHtmlReport(
    run,
    scenario?.name ?? run.scenarioId,
    project?.name ?? run.projectId,
  );
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${run.id}.html"`,
    },
  });
}
