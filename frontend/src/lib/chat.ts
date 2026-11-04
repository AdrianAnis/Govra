import "@/lib/zod-config";
import { z } from "zod";

export const MAX_MESSAGES = 30;
export const MAX_QUESTION_LENGTH = 500;
const MAX_CONTENT_LENGTH = 2000;

const roleSchema = z.enum(["USER", "ASSISTANT"]);

export const sourceSchema = z.object({
  kind: z.enum(["PROGRAM", "ISSUE"]),
  title: z.string(),
  path: z.string().startsWith("/"),
});

export const cardSchema = z.object({
  id: z.string(),
  type: z.enum(["REPORT", "PROGRAM", "ISSUE", "ACTION"]),
  title: z.string(),
  subtitle: z.string().optional(),
  status: z.string().optional(),
  statusTone: z.enum(["good", "warn", "bad", "neutral"]).optional(),
  badge: z.string().optional(),
  progress: z.number().optional(),
  meta: z.string().optional(),
  href: z.string(),
  actionLabel: z.string().optional(),
});

export const replySchema = z.object({
  reply: z.string(),
  sources: z.array(sourceSchema).default([]),
  cards: z.array(cardSchema).optional().default([]),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: roleSchema, content: z.string().min(1).max(MAX_CONTENT_LENGTH) }))
    .min(1)
    .max(MAX_MESSAGES),
});

export const persistedTurnsSchema = z.array(
  z.object({
    id: z.string(),
    role: roleSchema,
    content: z.string(),
    sources: z.array(sourceSchema).default([]),
    cards: z.array(cardSchema).optional().default([]),
  }),
);

export type ChatSource = z.infer<typeof sourceSchema>;
export type ChatRole = z.infer<typeof roleSchema>;
export type ChatCard = z.infer<typeof cardSchema>;

export interface ChatTurn {
  id: string;
  role: ChatRole;
  content: string;
  sources: readonly ChatSource[];
  cards?: readonly ChatCard[];
}
