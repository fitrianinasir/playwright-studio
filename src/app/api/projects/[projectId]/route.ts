import { jsonError } from "@/lib/api";
import { getProject } from "@/lib/store";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { projectId } = await ctx.params;
  const project = getProject(projectId);
  if (!project) return jsonError("Project not found.", 404);
  return Response.json({ project });
}
