import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import { buildHtmlReport } from "@/lib/report-html";
import { getProject, getRun, getScenario } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (methodNotAllowed(req, res, ["GET"])) return;

  const runId = firstQuery(req.query.runId);
  const run = getRun(runId);
  if (!run) {
    jsonError(res, "Run not found.", 404);
    return;
  }
  const project = getProject(run.projectId);
  const scenario = getScenario(run.scenarioId);
  const html = buildHtmlReport(
    run,
    scenario?.name ?? run.scenarioId,
    project?.name ?? run.projectId,
  );
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${run.id}.html"`);
  res.status(200).send(html);
}
