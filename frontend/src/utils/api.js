import { supabase } from '../supabaseClient.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {

  }

  if (!res.ok) {
    const message = body?.error || `Грешка при повикување на ${path}`;
    throw new Error(message);
  }

  return body;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data || {}) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data || {}) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
