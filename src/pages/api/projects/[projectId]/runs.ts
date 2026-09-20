import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import {
  clearRegressionHistory,
  getProject,
  listBaselines,
  listRuns,
} from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = firstQuery(req.query.projectId);
  if (!getProject(projectId)) {
    jsonError(res, "Project not found.", 404);
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      runs: listRuns(projectId),
      baselines: listBaselines(projectId),
    });
    return;
  }

  if (req.method === "DELETE") {
    const cleared = clearRegressionHistory(projectId);
    res.status(200).json({ ok: true, ...cleared });
    return;
  }

  methodNotAllowed(req, res, ["GET", "DELETE"]);
}
