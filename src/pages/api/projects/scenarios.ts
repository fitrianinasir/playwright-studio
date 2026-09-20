import type { NextApiRequest, NextApiResponse } from "next";
import { jsonError, methodNotAllowed } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const scenarios = await prisma.scenario.findMany({
        include: { steps: true },
      });
      return res.status(200).json({ scenarios });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load scenarios.";
      return jsonError(res, message, 500);
    }
  }

  if (req.method === "POST") {
    console.log("body", req.body)
    try {
      const scenario = await prisma.scenario.create({
        data: req.body,
      });
      return res.status(200).json({ scenario });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create scenario.";
      return jsonError(res, message, 500);
    }
  }

  if(req.method === "DELETE") {
    try {
      const scenario = await prisma.scenario.delete({
        where: { id: req.query.id as string },
      });
      return res.status(200).json({ scenario });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete scenario.";
      return jsonError(res, message, 500);
    }
  }
}
