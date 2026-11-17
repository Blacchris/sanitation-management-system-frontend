const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const AUTH_PATH = '/api/v1/auth'

/** @typedef {'EMAIL' | 'SMS'} OtpChannel */

/** @typedef {Object} OrganizationRegistrationRequest
 * @property {string} organizationName
 * @property {string} [registrationNumber]
 * @property {string} [description]
 * @property {string} servicesDescription
 * @property {string} contactEmail
 * @property {string} contactPhone
 * @property {string} businessAddress
 * @property {OtpChannel} otpChannel
 */

/** @typedef {Object} RegistrationResponse
 * @property {string} message
 * @property {string} email
 * @property {OtpChannel} channel
 * @property {string} sentTo
 * @property {number} otpExpiresInSeconds
 */

/** @typedef {{email: string}} ResendOtpRequest */

/** @typedef {Object} OrganizationSummary
 * @property {number} id
 * @property {string} organizationName
 * @property {string|null} registrationNumber
 * @property {string} contactEmail
 * @property {string} contactPhone
 * @property {string} businessAddress
 * @property {string} verificationStatus
 * @property {boolean} acceptingRequests
 */

/** @typedef {Object} AuthResponse
 * @property {string} tokenType
 * @property {string} accessToken
 * @property {number} expiresIn
 * @property {{id: number, fullName: string, email: string, phone: string, role: 'CUSTOMER'|'ADMIN', accountStatus: string}} user
 */

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

/** @param {{fullName: string, email: string, phone: string, password: string, otpChannel: OtpChannel}} payload */
export const registerCustomer = (payload) => request('/register/customer', payload)
/** @param {OrganizationRegistrationRequest} payload @returns {Promise<RegistrationResponse>} */
export const registerOrganization = (payload) => request('/register/organization', payload)
/** @param {ResendOtpRequest} payload @returns {Promise<RegistrationResponse>} */
export const resendOtp = (payload) => request('/register/resend-otp', payload)
/** @param {{email: string, otp: string}} payload @returns {Promise<AuthResponse>} */
export const verifyOtp = (payload) => request('/verify-otp', payload)
/** @param {{email: string, otp: string}} payload @returns {Promise<OrganizationSummary>} */
export const verifyOrganizationOtp = (payload) => request('/verify-otp/organization', payload)
/** @param {{email: string, password: string}} payload @returns {Promise<AuthResponse>} */
export const login = (payload) => request('/login', payload)
