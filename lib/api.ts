/* SSR-safe API client with Authorization */
const IS_SERVER = typeof window === "undefined";
const PUBLIC_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);
const BACKEND_PORT = process.env.BACKEND_PORT || "4000";

export const API_BASE = IS_SERVER
  ? PUBLIC_BASE || `http://localhost:${BACKEND_PORT}`
  : PUBLIC_BASE || "";

function withBase(path: string) {
  const base = API_BASE.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function toQuery(params?: Record<string, any>) {
  const sp = new URLSearchParams();
  if (!params) return "";
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function getBrowserToken(): string | undefined {
  if (IS_SERVER) return;
  try {
    const m = document.cookie.match(
      /(?:^|;\s*)(token|auth_token|Authorization)=([^;]+)/i
    );
    if (m) {
      const val = decodeURIComponent(m[2]);
      return m[1].toLowerCase() === "authorization"
        ? val.replace(/^Bearer\s+/i, "")
        : val;
    }
    const keys = ["token", "auth_token", "singulix_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v.replace(/^Bearer\s+/i, "");
    }
  } catch {}
  return;
}

type JReqInit = RequestInit & { authToken?: string };

async function jsonFetch<T>(input: string, init?: JReqInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  const token = init?.authToken ?? getBrowserToken();
  if (token && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  const raw = await res.text();

  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // biarkan raw
  }

  // Unwrap hanya untuk { data: ... } agar { items, total } tidak hilang
  const payload: any =
    data && typeof data === "object" && "data" in data
      ? (data as any).data
      : data;

  if (!res.ok) {
    const msg =
      payload?.error ||
      data?.message ||
      raw ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return payload as T;
}

/* ---------- Public API helpers ---------- */

export const Auth = {
  login(body: {
    username?: string;
    password: string;
    email?: string;
    identifier?: string;
  }) {
    return jsonFetch<{ token: string; user: any }>(
      withBase(`/api/auth/login`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  },
};

/* ---------- ACCOUNT (password & recovery) ---------- */

export const Account = {
  async forgot({ username }: { username: string }) {
    const res = await fetch(withBase("/api/auth/forgot"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reset({
    username,
    token,
    newPassword,
  }: {
    username: string;
    token: string;
    newPassword: string;
  }) {
    const res = await fetch(withBase("/api/auth/reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, token, newPassword }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  changePassword(body: { currentPassword: string; newPassword: string }) {
    return jsonFetch<{ ok: true }>(withBase(`/api/account/password`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  generateRecoveryCodes() {
    return jsonFetch<{ codes: string[] }>(
      withBase(`/api/account/recovery-codes/generate`),
      {
        method: "POST",
      }
    );
  },

  recoveryReset(body: {
    username: string;
    recoveryCode: string;
    newPassword: string;
  }) {
    return jsonFetch<{ ok: true }>(withBase(`/api/account/recovery-reset`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};

/* ---------- USERS ---------- */

export const Users = {
  list() {
    return jsonFetch<{ users: any[] }>(withBase(`/api/users`));
  },
  create(body: { name?: string; username: string; password: string }) {
    return jsonFetch<{ user: any }>(withBase(`/api/users`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  update(id: number, body: { name?: string; password?: string }) {
    return jsonFetch<{ user: any }>(withBase(`/api/users/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  resetPassword(id: number, newPassword: string) {
    return jsonFetch<{ ok: true }>(withBase(`/api/users/${id}/password`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
  },
  remove(id: number) {
    return jsonFetch<{ ok: true }>(withBase(`/api/users/${id}`), {
      method: "DELETE",
    });
  },

  // opsional, kalau kamu pakai fitur owner generate token
  generateResetToken(id: number) {
    return jsonFetch<{ ok: true; token: string; expiresAt: string }>(
      withBase(`/api/users/${id}/generate-reset-token`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};

/* ---------- STORES ---------- */
export const Stores = {
  /**
   * list(token)  -> Store[]
   * list({ authToken, limit, offset, query }) -> Store[]
   */
  list(
    arg?:
      | string
      | {
          limit?: number;
          offset?: number;
          query?: Record<string, any>;
          authToken?: string;
        }
  ) {
    const opts = typeof arg === "string" ? { authToken: arg } : arg ?? {};
    const q = toQuery({
      limit: opts.limit,
      offset: opts.offset,
      ...opts.query,
    });
    return jsonFetch<any[]>(withBase(`/api/stores${q}`), {
      authToken: opts.authToken,
    });
  },

  create(body: { name: string; type?: string }, authToken?: string) {
    return jsonFetch<any>(withBase(`/api/stores`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      authToken,
    });
  },

  update(
    id: number,
    body: Partial<{ name: string; type: string }>,
    authToken?: string
  ) {
    return jsonFetch<any>(withBase(`/api/stores/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      authToken,
    });
  },

  remove(id: number, authToken?: string) {
    return jsonFetch<{ ok: true }>(withBase(`/api/stores/${id}`), {
      method: "DELETE",
      authToken,
    });
  },
};

/* ---------- PRODUCTS ---------- */
export const Products = {
  /** list(token) atau list({ authToken, ... }) -> Product[] */
  list(
    arg?:
      | string
      | {
          limit?: number;
          offset?: number;
          query?: Record<string, any>;
          authToken?: string;
        }
  ) {
    const opts = typeof arg === "string" ? { authToken: arg } : arg ?? {};
    const q = toQuery({
      limit: opts.limit,
      offset: opts.offset,
      ...opts.query,
    });
    return jsonFetch<any>(withBase(`/api/products${q}`), {
      authToken: opts.authToken,
    });
  },

  create(
    body: {
      name: string;
      category: string;
      grade: string;
      pricePcs?: number | null;
      priceBulk?: number | null;
      priceKg?: number | null;
      stock?: number;
      media?: { url: string; kind?: "IMAGE" | "DOCUMENT" }[];
    },
    authToken?: string
  ) {
    return jsonFetch<any>(withBase(`/api/products`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      authToken,
    });
  },

  update(
    id: number,
    body: Partial<{
      name: string;
      category: string;
      grade: string;
      pricePcs: number | null;
      priceBulk: number | null;
      priceKg: number | null;
      stock: number;
      media: { url: string; kind?: "IMAGE" | "DOCUMENT" }[];
    }>,
    authToken?: string
  ) {
    return jsonFetch<any>(withBase(`/api/products/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      authToken,
    });
  },
};

/* ---------- TRANSACTIONS ---------- */
export const Transactions = {
  list(opts?: {
    limit?: number;
    offset?: number;
    query?: Record<string, any>;
    authToken?: string;
  }) {
    const q = toQuery({
      limit: opts?.limit,
      offset: opts?.offset,
      ...opts?.query,
    });
    return jsonFetch<{ items: any[]; total: number }>(
      withBase(`/api/transactions${q}`),
      {
        authToken: opts?.authToken,
      }
    );
  },

  create(body: any, authToken?: string) {
    return jsonFetch<any>(withBase(`/api/transactions`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      authToken,
    });
  },

  update(id: number, body: any, authToken?: string) {
    return jsonFetch<any>(withBase(`/api/transactions/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      authToken,
    });
  },

  remove(id: number, authToken?: string) {
    return jsonFetch<any>(withBase(`/api/transactions/${id}`), {
      method: "DELETE",
      authToken,
    });
  },
};

/** Opsional: helper untuk Balls */
export const Balls = {
  list(opts?: { query?: Record<string, any>; authToken?: string }) {
    const q = toQuery(opts?.query);
    return jsonFetch<any[]>(withBase(`/api/balls${q}`), {
      authToken: opts?.authToken,
    });
  },
};

const Audit = {
  async list(
    params: {
      actorId?: number;
      action?: string;
      from?: string;
      to?: string;
      limit?: number;
    } = {}
  ) {
    const url = new URL(withBase("/api/audit"));
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        ...(IS_SERVER
          ? {}
          : { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }),
      },
      credentials: IS_SERVER ? "omit" : "include",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

const api = {
  Audit,
  API_BASE,
  Auth,
  Account,
  Users,
  Stores,
  Products,
  Transactions,
  Balls,
};

export default api;
