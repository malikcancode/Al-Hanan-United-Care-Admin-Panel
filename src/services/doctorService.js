import { apiRequest } from "./apiClient";

const toFormData = ({ photo, removePhoto, ...fields }) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, String(value ?? "")));
  if (photo) form.append("photo", photo);
  if (removePhoto) form.append("removePhoto", "true");
  return form;
};

export const getDoctors = () => apiRequest("/doctors/all");

export const createDoctor = (payload) => apiRequest("/doctors", { method: "POST", body: toFormData(payload) });

export const updateDoctor = (id, payload) => apiRequest(`/doctors/${id}`, { method: "PUT", body: toFormData(payload) });

// Visibility-only change without touching the photo
export const setDoctorVisibility = (id, isActive) =>
  apiRequest(`/doctors/${id}`, { method: "PUT", body: toFormData({ isActive }) });

export const reorderDoctors = (ids) => apiRequest("/doctors/reorder", { method: "PUT", body: { ids } });

export const deleteDoctor = (id) => apiRequest(`/doctors/${id}`, { method: "DELETE" });
