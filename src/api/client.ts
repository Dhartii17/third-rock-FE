import axios from "axios";

const USER_ID_KEY = "task_management_user_id";

function getClientUserId() {
  let id = window.localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.headers.set("x-user-id", getClientUserId());
  return config;
});

export function getCurrentUserId() {
  return getClientUserId();
}

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? error.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
}
