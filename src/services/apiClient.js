// Accepts values pasted into hosting dashboards without a scheme, with quotes or a trailing slash.
function normalizeApiUrl(raw) {
  let url = (raw || "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*(:\d+)?(\/|$)/i.test(url)) {
    url = `${/^(localhost|127\.0\.0\.1)(:|\/|$)/.test(url) ? "http" : "https"}://${url}`;
  }
  try {
    return { url, origin: new URL(url).origin };
  } catch {
    console.warn(`NEXT_PUBLIC_API_URL is missing or invalid ("${raw ?? ""}"). Expected e.g. https://api.example.com/api`);
    return { url: "", origin: "" };
  }
}

const { url: API_URL, origin: API_ORIGIN } = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
const TOKEN_KEY = "alhanna_admin_token";

export const AUTH_LOGOUT_EVENT = "auth:logout";

export const assetUrl = (path) => (!path || /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`);

export const tokenStorage = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const buildQuery = (query) =>
  query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== "" && v != null))}` : "";

async function send(path, { method = "GET", body, query } = {}) {
  const token = tokenStorage.get();
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let res;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      headers: {
        ...(body && !isForm && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && !isForm ? JSON.stringify(body) : body,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and that the API is running.", 0);
  }

  if (res.status === 401 && token) {
    tokenStorage.clear();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
  return res;
}

export async function apiRequest(path, options) {
  const res = await send(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || "Something went wrong", res.status, data.errors);
  return data;
}

// Downloads a file response (e.g. CSV) and saves it with the server's filename.
export async function apiDownload(path, options) {
  const res = await send(path, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.message || "Download failed", res.status);
  }
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] || "download";
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
