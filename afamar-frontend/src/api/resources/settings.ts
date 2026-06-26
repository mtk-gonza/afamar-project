import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { SettingsData } from "@/types";

export const settingsApi = {
  get: () => wrap<SettingsData>(() => http.get("/settings")),
  update: (data: SettingsData) => wrap<SettingsData>(() => http.put("/settings", data)),
};
