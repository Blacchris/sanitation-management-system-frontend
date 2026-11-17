const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const AUTH_PATH = '/api/v1/auth'

async function request(path, payload) {
  let response
  try {
    response = await fetch(`${API_BASE}${AUTH_PATH}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('We couldn’t reach the service. Check your connection and try again.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = response.status >= 500 ? fallbackMessage(response.status) : (body.message || fallbackMessage(response.status))
    const error = new Error(message)
    error.status = response.status
    error.fieldErrors = body.fieldErrors || {}
    throw error
  }
  return body
}

function fallbackMessage(status) {
  if (status === 401) return 'The email or password is incorrect.'
  if (status === 429) return 'Too many attempts. Please wait before trying again.'
  if (status >= 500) return 'Something went wrong on our side. Please try again shortly.'
  return 'We couldn’t complete that request. Please review your details and try again.'
}

export const registerCustomer = (payload) => request('/register/customer', payload)
export const registerOrganization = (payload) => request('/register/organization', payload)
export const verifyOtp = (payload) => request('/verify-otp', payload)
export const login = (payload) => request('/login', payload)
