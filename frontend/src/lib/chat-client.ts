import { replySchema, type ChatTurn } from "@/lib/chat";
import { ApiError, jsonInit, request } from "@/lib/http";

const RATE_LIMIT_STATUS = 429;

export function isRateLimited(failure: unknown): boolean {
  return failure instanceof ApiError && failure.status === RATE_LIMIT_STATUS;
}

export function askAssistant(turns: readonly ChatTurn[]) {
  const messages = turns.map((turn) => ({ role: turn.role, content: turn.content }));
  return request("/api/assistant", jsonInit({ messages }), replySchema);
}
