import { settingSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { updateSetting } from "@/lib/data/admin";

export async function PUT(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  return adminAction(request, settingSchema, (input) => updateSetting(key, input.value));
}
