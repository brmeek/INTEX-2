import { getPortalRedirectPath } from "@/lib/portalRoutes";

const API_BASE = import.meta.env.VITE_API_URL || "";

function getUnauthorizedRedirectPath(): string {
  const pathname = window.location.pathname.toLowerCase();

  if (pathname.startsWith("/admin")) {
    return getPortalRedirectPath("admin");
  }

  if (pathname.startsWith("/donor")) {
    return getPortalRedirectPath("donor");
  }

  return getPortalRedirectPath();
}

async function parseJsonOrUndefined<T>(res: Response): Promise<T | undefined> {
  const text = await res.text();
  if (!text) return undefined;
  return JSON.parse(text) as T;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = getUnauthorizedRedirectPath();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const data = await parseJsonOrUndefined<T>(res);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatCitation = {
  title: string;
  url?: string;
};

type ChatAskResponse = {
  answer: string;
  citations: ChatCitation[];
};

export const chatApi = {
  ask: (message: string, history: ChatMessage[]) =>
    request<ChatAskResponse>("/api/chat/ask", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
