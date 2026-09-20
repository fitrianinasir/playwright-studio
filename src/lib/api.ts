import type { NextApiRequest, NextApiResponse } from "next";

export { firstQuery } from "@/lib/query";

export function jsonError(
  res: NextApiResponse,
  message: string,
  status = 400,
) {
  res.status(status).json({ error: message });
}

export function originFrom(req: NextApiRequest, explicit?: string) {
  if (explicit) return explicit.replace(/\/$/, "");
  const header = req.headers.origin || req.headers["x-forwarded-host"];
  const host = Array.isArray(header) ? header[0] : header;
  if (host?.startsWith("http")) return host.replace(/\/$/, "");
  if (host) {
    const protoHeader = req.headers["x-forwarded-proto"];
    const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || "http";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export function methodNotAllowed(
  req: NextApiRequest,
  res: NextApiResponse,
  allow: string[],
) {
  if (allow.includes(req.method ?? "")) return false;
  res.setHeader("Allow", allow.join(", "));
  jsonError(res, "Method not allowed.", 405);
  return true;
}
