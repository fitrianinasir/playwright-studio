export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function originFrom(request: Request, explicit?: string) {
  if (explicit) return explicit.replace(/\/$/, "");
  const header =
    request.headers.get("origin") || request.headers.get("x-forwarded-host");
  if (header?.startsWith("http")) return header.replace(/\/$/, "");
  if (header) {
    const proto = request.headers.get("x-forwarded-proto") || "http";
    return `${proto}://${header}`;
  }
  return "http://localhost:3000";
}
