import { jsonError } from "@/lib/api";
import { createScenario, getProject, listScenarios } from "@/lib/store";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { projectId } = await ctx.params;
  if (!getProject(projectId)) return jsonError("Project not found.", 404);
  return Response.json({ scenarios: listScenarios(projectId) });
}

export async function POST(request: Request, ctx: Ctx) {
  const { projectId } = await ctx.params;
  if (!getProject(projectId)) return jsonError("Project not found.", 404);
  const body = (await request.json()) as { name?: string; description?: string };
  const name = body.name?.trim() ?? "";
  if (!name) return jsonError("Scenario name is required.");
  const scenario = createScenario({
    projectId,
    name,
    description: body.description?.trim() ?? "",
  });
  return Response.json({ scenario });
}
