const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type ApiError = { message: string; status: number };

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let message = "Erreur serveur";
    try { const d = await res.json(); message = d.message || message; } catch {}
    throw { message, status: res.status } as ApiError;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, token),
  del: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE" }, token),
};

export async function uploadMedia(
  formData: FormData,
  token: string,
  path = "/api/uploads"
): Promise<{ url: string; type: string; thumbnail?: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw { message: d.message || "Upload échoué", status: res.status };
  }
  return res.json();
}
