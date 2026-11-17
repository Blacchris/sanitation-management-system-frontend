import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sanitation.auth'

function readStoredAuth() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)
  const value = useMemo(() => ({
    auth,
    authenticate(response) {
      const next = { tokenType: response.tokenType, accessToken: response.accessToken, expiresIn: response.expiresIn, user: response.user, organization: response.organization ?? null }
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
