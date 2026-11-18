import { apiRequest } from "./apiClient";

export const getActivity = (query) => apiRequest("/activity", { query });
