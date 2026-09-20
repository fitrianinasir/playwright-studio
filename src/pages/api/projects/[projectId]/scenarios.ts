import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import { createScenario, getProject, listScenarios } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = firstQuery(req.query.projectId);
  if (!getProject(projectId)) {
    jsonError(res, "Project not found.", 404);
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ scenarios: listScenarios(projectId) });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as { name?: string; description?: string };
    const name = body.name?.trim() ?? "";
    if (!name) {
      jsonError(res, "Scenario name is required.");
      return;
    }
    const scenario = createScenario({
      projectId,
      name,
      description: body.description?.trim() ?? "",
    });
    res.status(200).json({ scenario });
    return;
  }

  methodNotAllowed(req, res, ["GET", "POST"]);
}
