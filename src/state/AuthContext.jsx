import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sanitation.auth'

/** @typedef {{tokenType: string, accessToken: string, expiresIn: number, user: {id: number, fullName: string, email: string, phone: string, role: 'CUSTOMER'|'ADMIN', accountStatus: string}}|null} AuthState */

function readStoredAuth() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (!stored) return null
    if (!['CUSTOMER', 'ADMIN'].includes(stored.user?.role)) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    const { tokenType, accessToken, expiresIn, user } = stored
    return { tokenType, accessToken, expiresIn, user }
  } catch { return null }
}

export function AuthProvider({ children }) {
  /** @type {[AuthState, (next: AuthState) => void]} */
  const [auth, setAuth] = useState(readStoredAuth)
  const value = useMemo(() => ({
    auth,
    authenticate(response) {
      const next = { tokenType: response.tokenType, accessToken: response.accessToken, expiresIn: response.expiresIn, user: response.user }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* Keep the signed-in state for this tab if storage is unavailable. */ }
      setAuth(next)
    },
    signOut() { try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* The in-memory state can still be cleared. */ } setAuth(null) },
  }), [auth])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
