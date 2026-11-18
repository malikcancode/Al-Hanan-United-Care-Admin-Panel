import { apiDownload, apiRequest } from "./apiClient";

export const getAppointments = (query) => apiRequest("/appointments", { query });

export const createAppointment = (payload) => apiRequest("/appointments/manual", { method: "POST", body: payload });

export const updateAppointment = (id, payload) => apiRequest(`/appointments/${id}`, { method: "PATCH", body: payload });

export const bulkUpdateAppointments = (ids, status) =>
  apiRequest("/appointments/bulk", { method: "PATCH", body: { ids, status } });

export const exportAppointments = (query) => apiDownload("/appointments/export", { query });

export const deleteAppointment = (id) => apiRequest(`/appointments/${id}`, { method: "DELETE" });
