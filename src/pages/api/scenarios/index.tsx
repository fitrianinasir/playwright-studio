import type { NextApiRequest, NextApiResponse } from "next";
import { jsonError, methodNotAllowed } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
