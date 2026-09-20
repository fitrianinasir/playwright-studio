import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import { getProject } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (methodNotAllowed(req, res, ["GET"])) return;
  const projectId = firstQuery(req.query.projectId);
  const project = getProject(projectId);
  if (!project) {
    jsonError(res, "Project not found.", 404);
    return;
  }
  res.status(200).json({ project });
}
