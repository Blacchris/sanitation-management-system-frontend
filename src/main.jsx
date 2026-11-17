import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './state/AuthContext.jsx'
import AuthApp from './AuthApp.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider><AuthApp /></AuthProvider>
  </React.StrictMode>,
)
