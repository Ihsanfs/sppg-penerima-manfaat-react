const TOKEN_KEY = 'sppg_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, { ...options, headers });

  if (response.status === 401 && path !== '/auth/login') {
    clearToken();
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Permintaan gagal (${response.status})`);
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
