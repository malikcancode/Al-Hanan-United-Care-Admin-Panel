import { apiRequest } from "./apiClient";

export const getStats = () => apiRequest("/dashboard/stats");
