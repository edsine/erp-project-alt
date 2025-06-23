import React, { createContext, useState, useEffect, useContext } from 'react'
const BASE_URL = import.meta.env.VITE_BASE_URL;

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // login function: calls backend API to login
  async function login(credentials) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!res.ok) {
        throw new Error('Login failed')
      }

      const data = await res.json()

      // Assuming backend returns user info and token like { user: {...}, token: "..." }
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token) // Save token if needed for auth headers

      setLoading(false)
      return { success: true }
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
      return { success: false, error: err.message }
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
