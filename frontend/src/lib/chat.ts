import "@/lib/zod-config";
import { z } from "zod";

export const MAX_MESSAGES = 20;
export const MAX_QUESTION_LENGTH = 500;
const MAX_CONTENT_LENGTH = 2000;

const roleSchema = z.enum(["USER", "ASSISTANT"]);

export const sourceSchema = z.object({
  kind: z.enum(["PROGRAM", "ISSUE"]),
  title: z.string(),
  path: z.string().startsWith("/"),
});

export const replySchema = z.object({ reply: z.string(), sources: z.array(sourceSchema) });

export const chatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: roleSchema, content: z.string().min(1).max(MAX_CONTENT_LENGTH) }))
    .min(1)
    .max(MAX_MESSAGES),
});

export const persistedTurnsSchema = z.array(
  z.object({ id: z.string(), role: roleSchema, content: z.string(), sources: z.array(sourceSchema) }),
);

export type ChatSource = z.infer<typeof sourceSchema>;
export type ChatRole = z.infer<typeof roleSchema>;

export interface ChatTurn {
  id: string;
  role: ChatRole;
  content: string;
  sources: readonly ChatSource[];
}
