import { apiRequest } from "./apiClient";

export const login = (email, password) =>
  apiRequest("/auth/login", { method: "POST", body: { email, password } });

export const getMe = () => apiRequest("/auth/me");

export const changePassword = (currentPassword, newPassword) =>
  apiRequest("/auth/password", { method: "PUT", body: { currentPassword, newPassword } });
