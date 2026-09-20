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
    try {
      const scenario = await prisma.scenario.findUnique({
        where: { id: scenarioId },
        include: { steps: true },
      });
      return res.status(200).json({ scenario });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load scenario.";
      return jsonError(res, message, 500);
    }
  }

  if (req.method === "PUT") {
    try {
      const { steps, id, createdAt, updatedAt, user, ...rest } = req.body ?? {};
      const scenario = await prisma.scenario.update({
        where: { id: scenarioId },
        data: {
          name: rest.name,
          description: rest.description,
          browsers: rest.browsers,
          device: rest.device ?? "",
          ...(Array.isArray(steps)
            ? {
                steps: {
                  deleteMany: {},
                  create: steps.map(
                    (step: {
                      id?: string;
                      kind: string;
                      name: string;
                      params: unknown;
                    }) => ({
                      ...(step.id ? { id: step.id } : {}),
                      kind: step.kind,
                      name: step.name,
                      params: step.params ?? {},
                    }),
                  ),
                },
              }
            : {}),
        },
        include: { steps: true },
      });
      return res.status(200).json({ scenario });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update scenario.";
      return jsonError(res, message, 500);
    }
  }

  if (req.method === "DELETE") {
    deleteScenario(scenarioId);
    res.status(200).json({ ok: true });
    return;
  }

  methodNotAllowed(req, res, ["GET", "PUT", "DELETE"]);
}
