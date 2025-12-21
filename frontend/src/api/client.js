const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_PROXY_TARGET ||
  ""
).replace(/\/$/, ""); // remove trailing slash

export async function apiFetch(path, { token, method = "GET", json, form } = {}) {
  const headers = { Accept: "application/json" };
  let body = undefined;

  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { method, headers, body });

  const text = await res.text();

  // if empty body on success -> don't return null (prevents access_token crash)
  if (res.ok && !text) return {};

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const message =
      (data &&
        data.detail &&
        (typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail))) ||
      (typeof data === "string" ? data : "Request failed");
    throw new Error(`${res.status} ${message}`);
  }

  return data;
}