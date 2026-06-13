import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

http.interceptors.response.use(
  (res) => {
    if (res.status === 204) return res;
    if (res.data && "success" in res.data) {
      if (!res.data.success) {
        return Promise.reject(new Error(res.data.error || "Error"));
      }
      res.data = res.data.data;
    }
    return res;
  },
  (error) => {
    const msg = error.response?.data?.error || error.response?.data?.detail?.[0]?.msg || error.message || "Error de conexión";
    return Promise.reject(new Error(msg));
  },
);

export default http;
