import { boot } from 'quasar/wrappers'
import { LocalStorage } from 'quasar'

const API_BASE_URL = 'http://localhost:3000/api'

// Centralized API fetcher with safety defaults
const apiFetch = async (endpoint, options = {}) => {
  const token = LocalStorage.getItem('auth_token')
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) }
  })

  // Handle session expiration
  if (response.status === 401 || response.status === 403) {
    if (window.location.hash !== '#/login') {
      LocalStorage.remove('auth_token')
      window.location.reload() // Force clean state
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.statusText}`)
  }

  return await response.json()
}

const api = {
  get: (url) => apiFetch(url, { method: 'GET' }),
  post: (url, data) => apiFetch(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => apiFetch(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => apiFetch(url, { method: 'DELETE' })
}

export default boot(({ app }) => {
  // Global Diagnostic Handler
  app.config.errorHandler = (err, instance, info) => {
    console.error('DIAGNOSTIC CRASH:', err)
    console.error('Component Instance:', instance)
    console.error('Error info context:', info)
  }
  
  // BYPASS DEVTOOLS PROXY BUG
  app.config.devtools = false

  window.addEventListener('error', (event) => {
    console.error('GLOBAL WINDOW ERROR:', event.error)
  })

  app.config.globalProperties.$api = api
})

export { api }
