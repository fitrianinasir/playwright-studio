import type { NextApiRequest, NextApiResponse } from "next";
import { jsonError, methodNotAllowed } from "@/lib/api";
import { clearRegressionHistory, listBaselines, listRuns } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json({
      runs: listRuns(),
      baselines: listBaselines(),
    });
    return;
  }

  if (req.method === "DELETE") {
    const cleared = clearRegressionHistory();
    res.status(200).json({ ok: true, ...cleared });
    return;
  }

  methodNotAllowed(req, res, ["GET", "DELETE"]);
}
