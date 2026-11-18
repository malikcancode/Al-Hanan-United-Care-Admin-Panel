import { apiRequest } from "./apiClient";

export const getServices = () => apiRequest("/services/all");

export const createService = (payload) => apiRequest("/services", { method: "POST", body: payload });

export const updateService = (id, payload) => apiRequest(`/services/${id}`, { method: "PUT", body: payload });

export const reorderServices = (ids) => apiRequest("/services/reorder", { method: "PUT", body: { ids } });

export const deleteService = (id) => apiRequest(`/services/${id}`, { method: "DELETE" });
