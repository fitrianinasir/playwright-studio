import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import { createScenario, getProject, listScenarios } from "@/lib/store";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {


  if (req.method === "GET") {
    try {
      const scenarios = await prisma.scenario.findMany({
        include: { steps: true },
      });
      res.status(200).json({ scenarios });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load scenarios.";
      jsonError(res, message, 500);
    }
  }

  const projectId = firstQuery(req.query.projectId);
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
