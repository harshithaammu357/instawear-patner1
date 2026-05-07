import axios from "axios";


const BACKEND_URL = "https://instawear-backend.onrender.com";

export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});


api.interceptors.request.use((config) => {
  const t = localStorage.getItem("iw_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
