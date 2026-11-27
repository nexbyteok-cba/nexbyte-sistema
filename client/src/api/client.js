// Centralized API Client with token handling and response formatting

const API_BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('nexbyte_token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si no es FormData, colocar Content-Type application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = (typeof data === 'object' && data?.error) ? data.error : 'Ocurrió un error en la solicitud.';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body) => apiRequest(url, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (url, body) => apiRequest(url, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  patch: (url, body) => apiRequest(url, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};
