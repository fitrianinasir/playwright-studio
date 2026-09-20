import type { NextApiRequest, NextApiResponse } from "next";
import { firstQuery, jsonError, methodNotAllowed } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getRun, saveBaseline } from "@/lib/store";
import type { TestRun } from "@/lib/studio-types";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

function slimRun(run: TestRun): TestRun {
  return {
    ...run,
    results: run.results.map((result) => ({
      ...result,
      steps: result.steps.map((step) => ({
        ...step,
        screenshot: undefined,
        baseline: undefined,
        diff: undefined,
      })),
    })),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const runId = firstQuery(req.query.runId);
  const run = getRun(runId);
  if (!run) {
    jsonError(res, "Run not found.", 404);
    return;
  }

  if (req.method === "GET") {
    const slim = firstQuery(req.query.slim) === "1";
    const row = await prisma.scenario.findUnique({
      where: { id: run.scenarioId },
      include: { steps: true },
    });
    res.status(200).json({
      run: slim ? slimRun(run) : run,
      scenario: row,
    });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      browser?: string;
      snapshotName?: string;
      image?: string;
    };
    const browserResult =
      run.results.find((result) => result.browser === body.browser) ??
      run.results[0];
    const step =
      browserResult?.steps.find(
        (item) => item.name === body.snapshotName && item.screenshot,
      ) ?? browserResult?.steps.find((item) => item.screenshot);
    const image = body.image || step?.screenshot;
    if (!image || !browserResult) {
      jsonError(res, "No screenshot to promote.");
      return;
    }
    const baseline = saveBaseline({
      scenarioId: run.scenarioId,
      snapshotName: body.snapshotName || step?.name || "snapshot",
      browser: browserResult.browser,
      device: run.device,
      image,
    });
    res.status(200).json({ baseline });
    return;
  }

  methodNotAllowed(req, res, ["GET", "POST"]);
}
