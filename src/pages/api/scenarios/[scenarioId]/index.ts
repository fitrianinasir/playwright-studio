import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import { deleteScenario, getScenario, updateScenario } from "@/lib/store";
import type {
  BrowserName,
  DevicePreset,
  ScenarioStep,
} from "@/lib/studio-types";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const scenarioId = firstQuery(req.query.scenarioId);

  if (req.method === "GET") {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { steps: true },
    });
    res.status(200).json({ scenario });
    return;
  }

  if (req.method === "PUT") {
    const body = (req.body ?? {}) as {
      name?: string;
      description?: string;
      steps?: ScenarioStep[];
      browsers?: BrowserName[];
      device?: DevicePreset;
    };
    res.status(200).json({ scenario: updateScenario(scenarioId, body) });
    return;
  }

  if (req.method === "DELETE") {
    deleteScenario(scenarioId);
    res.status(200).json({ ok: true });
    return;
  }

  methodNotAllowed(req, res, ["GET", "PUT", "DELETE"]);
}
