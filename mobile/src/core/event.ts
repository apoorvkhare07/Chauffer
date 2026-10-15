import type { FunctionArgs } from "convex/server";
import type { api } from "../../../convex/_generated/api";
export type StyleEvent = NonNullable<
  FunctionArgs<typeof api.stylist.request>["event"]
>;
export function todayEvent(): StyleEvent {
  const now = new Date();
  return {
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    timeZone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    period: "auto",
    setting: "unspecified",
  };
}
