import { jsonError } from "@/lib/api";
import {
  clearRegressionHistory,
  getProject,
  listBaselines,
  listRuns,
} from "@/lib/store";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { projectId } = await ctx.params;
  if (!getProject(projectId)) return jsonError("Project not found.", 404);
  return Response.json({
    runs: listRuns(projectId),
    baselines: listBaselines(projectId),
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { projectId } = await ctx.params;
  if (!getProject(projectId)) return jsonError("Project not found.", 404);
  const cleared = clearRegressionHistory(projectId);
  return Response.json({ ok: true, ...cleared });
}
