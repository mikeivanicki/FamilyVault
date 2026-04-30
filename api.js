const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ─── Token Storage ────────────────────────────────────────────────────────────
let _token = null;
export const getToken = () => _token;
export const setToken = (t) => { _token = t; };
export const clearToken = () => { _token = null; };

// ─── Base Fetch ───────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // If token expired, clear it so the app redirects to login
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth:expired"));
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  scheduleTokenRefresh();
  return data.user;
}

export async function register(email, password) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  scheduleTokenRefresh();
  return data.user;
}

export async function joinFamily(token, email, password) {
  const data = await apiFetch("/auth/join", {
    method: "POST",
    body: JSON.stringify({ token, email, password }),
  });
  setToken(data.token);
  scheduleTokenRefresh();
  return data.user;
}

export async function generateInvite(role) {
  const data = await apiFetch("/family/invite", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
  return data.inviteLink;
}

export function logout() {
  clearToken();
  if (_refreshTimer) clearTimeout(_refreshTimer);
}

// ─── Token Auto-Refresh ───────────────────────────────────────────────────────
// JWTs expire in 15 min. Refresh silently every 13 min while the user is active.

let _refreshTimer = null;
function scheduleTokenRefresh() {
  if (_refreshTimer) clearTimeout(_refreshTimer);
  _refreshTimer = setTimeout(async () => {
    try {
      const data = await apiFetch("/auth/refresh", { method: "POST" });
      setToken(data.token);
      scheduleTokenRefresh();
    } catch {
      clearToken(); 
    }
  }, 13 * 60 * 1000);
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function fetchAccounts() {
  return apiFetch("/accounts");
}

export async function revealPassword(accountId) {
  const data = await apiFetch(`/accounts/${accountId}/reveal`);
  return data.password;
}

export async function createAccount(accountData) {
  return apiFetch("/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  });
}

export async function updateAccount(accountId, accountData) {
  return apiFetch(`/accounts/${accountId}`, {
    method: "PUT",
    body: JSON.stringify(accountData),
  });
}

export async function deleteAccount(accountId) {
  return apiFetch(`/accounts/${accountId}`, { method: "DELETE" });
}
