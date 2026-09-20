const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('portfolio_token')
  const isFormData = options.body instanceof FormData
  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.message || ([502, 503, 504].includes(response.status) ? 'The server is temporarily unavailable. Please try again shortly.' : `Request failed (${response.status})`))
    error.status = response.status
    throw error
  }
  if (data === null && response.status !== 204) {
    throw new Error('The server returned an invalid response. Please try again.')
  }
  return data
}

export const contentApi = {
  list: (resource) => apiRequest(`/${resource}`),
  create: (resource, data) => apiRequest(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource, id, data) => apiRequest(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (resource, id) => apiRequest(`/${resource}/${id}`, { method: 'DELETE' }),
}

export const loginAdmin = (credentials) => apiRequest('/admin/login', { method: 'POST', body: JSON.stringify(credentials) })
export const sendMessage = (data) => apiRequest('/messages', { method: 'POST', body: JSON.stringify(data) })
export const uploadFile = (file) => {
  const body = new FormData()
  body.append('file', file)
  return apiRequest('/upload', { method: 'POST', body })
}
