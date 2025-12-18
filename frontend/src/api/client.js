export async function apiFetch(path, { token, method = "GET", json, form } = {}) {
  const headers = { Accept: "application/json" };

  let body = undefined;

  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  // For login (OAuth2PasswordRequestForm style)
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { method, headers, body });

  // Try to parse JSON error nicely
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const message =
      (data && data.detail && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
      (typeof data === "string" ? data : "Request failed");
    throw new Error(`${res.status} ${message}`);
  }

  return data;
}