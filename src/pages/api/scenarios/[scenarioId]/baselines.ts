import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import {
  clearBaselinesForScenario,
  deleteBaseline,
  getScenario,
  listBaselines,
} from "@/lib/store";

function scenarioBaselines(scenarioId: string) {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;
  return listBaselines(scenario.projectId).filter(
    (baseline) => baseline.scenarioId === scenarioId,
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const scenarioId = firstQuery(req.query.scenarioId);
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    jsonError(res, "Scenario not found.", 404);
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ baselines: scenarioBaselines(scenarioId) });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      action?: string;
      baselineId?: string;
    };

    if (body.action === "delete-one") {
      const baselineId = body.baselineId?.trim() ?? "";
      if (!baselineId) {
        jsonError(res, "baselineId is required.");
        return;
      }
      const baselines = scenarioBaselines(scenarioId) ?? [];
      const match = baselines.find((baseline) => baseline.id === baselineId);
      if (!match) {
        jsonError(res, "Baseline not found for this scenario.", 404);
        return;
      }
      deleteBaseline(baselineId);
      res.status(200).json({ ok: true, cleared: 1, baselineId });
      return;
    }

    if (body.action === "clear-all") {
      const cleared = clearBaselinesForScenario(scenarioId);
      res.status(200).json({ ok: true, cleared });
      return;
    }

    jsonError(res, 'Unknown action. Use "delete-one" or "clear-all".');
    return;
  }

  if (req.method === "DELETE") {
    const baselineId = firstQuery(req.query.baselineId).trim();
    if (baselineId) {
      const baselines = scenarioBaselines(scenarioId) ?? [];
      const match = baselines.find((baseline) => baseline.id === baselineId);
      if (!match) {
        jsonError(res, "Baseline not found for this scenario.", 404);
        return;
      }
      deleteBaseline(baselineId);
      res.status(200).json({ ok: true, cleared: 1, baselineId });
      return;
    }

    const cleared = clearBaselinesForScenario(scenarioId);
    res.status(200).json({ ok: true, cleared });
    return;
  }

  methodNotAllowed(req, res, ["GET", "POST", "DELETE"]);
}
