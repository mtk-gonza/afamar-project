import http from "../http";

export const authApi = {
  login: (data: { username: string; password: string }) => http.post("/auth/login", data).then((r) => r.data),
  me: () => http.get("/auth/me").then((r) => r.data),
  register: (data: { username: string; email: string; password: string; full_name?: string }) =>
    http.post("/auth/register", data).then((r) => r.data),
};
