import { apiRequest } from "./apiClient";

export const getMessages = (query) => apiRequest("/messages", { query });

export const updateMessage = (id, payload) => apiRequest(`/messages/${id}`, { method: "PATCH", body: payload });

export const bulkUpdateMessages = (ids, status) => apiRequest("/messages/bulk", { method: "PATCH", body: { ids, status } });

export const deleteMessage = (id) => apiRequest(`/messages/${id}`, { method: "DELETE" });
