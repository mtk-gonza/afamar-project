import http from "../http";
import { wrap } from "../wrap";
import type { SettingsData } from "../../types";

export const settingsApi = {
  get: () => wrap<SettingsData>(() => http.get("/settings")),
  update: (data: SettingsData) => wrap<SettingsData>(() => http.put("/settings", data)),
};
