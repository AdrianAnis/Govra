export function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ code, message, request_id: crypto.randomUUID() }, { status });
}
