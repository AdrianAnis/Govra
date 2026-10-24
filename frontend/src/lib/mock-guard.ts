import { errorResponse } from "@/lib/api-response";

const NOT_IMPLEMENTED_STATUS = 501;

export const DEMO_CODE = "123456";

export function mockOnly(): Response | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }
  return errorResponse("NOT_IMPLEMENTED", "Fitur ini menunggu backend.", NOT_IMPLEMENTED_STATUS);
}
