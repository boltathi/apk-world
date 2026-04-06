import type {
  Article,
  PaginatedResponse,
  AuthTokens,
  User,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Client-side fetch
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Server-side fetch (no auth, direct backend)
async function fetchServerAPI<T>(endpoint: string): Promise<T> {
  const backendUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://backend:5001";
  const res = await fetch(`${backendUrl}/api/v1${endpoint}`, {
    next: { revalidate: process.env.NODE_ENV === "development" ? 0 : 60 },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Normalizers: map backend field names → frontend TypeScript types ───
/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeArticle(raw: any): Article {
  return {
    ...raw,
    featured: raw.is_featured ?? raw.featured ?? false,
    published: raw.status ? raw.status === "published" : (raw.published ?? false),
    og_image: raw.featured_image ?? raw.og_image ?? "",
    author: raw.author ?? "",
    difficulty: raw.difficulty ?? "beginner",
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// Articles API
export const articlesAPI = {
  list: async (page = 1, per_page = 12, category?: string, difficulty?: string) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    const data = await fetchServerAPI<{ articles: any[]; total: number; page: number; pages: number }>(`/articles?${params}`);
    return { items: data.articles.map(normalizeArticle), total: data.total, page: data.page, per_page, total_pages: data.pages } as PaginatedResponse<Article>;
  },
  get: async (slug: string) => {
    const data = await fetchServerAPI<{ article: any }>(`/articles/${slug}`);
    return normalizeArticle(data.article);
  },
  featured: async () => {
    const data = await fetchServerAPI<{ articles: any[] }>("/articles/featured");
    return data.articles.map(normalizeArticle);
  },
  categories: async () => {
    const data = await fetchServerAPI<{ categories: string[] }>("/articles/categories");
    return data.categories;
  },
  search: async (q: string) => {
    const data = await fetchServerAPI<{ articles: any[] }>(`/articles/search?q=${encodeURIComponent(q)}`);
    return data.articles.map(normalizeArticle);
  },

  // Admin
  create: async (data: Partial<Article>) => {
    const raw = await fetchAPI<any>("/articles/admin", { method: "POST", body: JSON.stringify(data) });
    return normalizeArticle(raw.article ?? raw);
  },
  update: async (id: string, data: Partial<Article>) => {
    const raw = await fetchAPI<any>(`/articles/admin/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return normalizeArticle(raw.article ?? raw);
  },
  delete: (id: string) => fetchAPI<void>(`/articles/admin/${id}`, { method: "DELETE" }),
  adminList: async (page = 1, per_page = 20) => {
    const data = await fetchAPI<{ articles: any[]; total: number; page: number; pages: number }>(`/articles/admin?page=${page}&per_page=${per_page}`);
    return { items: data.articles.map(normalizeArticle), total: data.total, page: data.page, per_page, total_pages: data.pages } as PaginatedResponse<Article>;
  },
};

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    fetchAPI<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  refresh: (refreshToken: string) =>
    fetchAPI<{ access_token: string; refresh_token: string }>("/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),
  logout: () => fetchAPI<void>("/auth/logout", { method: "DELETE" }),
  me: () => fetchAPI<User>("/auth/me"),
};

// Newsletter API (admin-only)
export const newsletterAPI = {
  subscribers: () =>
    fetchAPI<{ subscribers: { email: string; subscribed_at: string; status: string }[]; total: number; last_send: Record<string, string> | null }>("/newsletter/admin/subscribers"),
  send: (subject: string, body: string) =>
    fetchAPI<{ message: string; sent: number; failed: number; total: number }>("/newsletter/admin/send", {
      method: "POST",
      body: JSON.stringify({ subject, body }),
    }),
};
