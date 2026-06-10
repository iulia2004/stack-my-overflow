import { useEffect, useState } from 'react'
import type { AuthUser } from '../types'

type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: Error }

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('smo_token')

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const text = await res.text()

  console.log('====================')
  console.log('URL:', `${API_URL}${path}`)
  console.log('STATUS:', res.status)
  console.log('RESPONSE:', text)
  console.log('====================')

  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      text ||
      `Request failed (${res.status})`
    )
  }

  return data
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('smo_token')

      if (!token) {
        setUser(null)
        setIsLoggedIn(false)
        setLoading(false)
        return
      }

      try {
        const data = await request('/auth/me')
        setUser(data.user)
        setIsLoggedIn(true)
      } catch (error) {
        localStorage.removeItem('smo_token')
        localStorage.removeItem('smo_refresh')
        setUser(null)
        setIsLoggedIn(false)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const createErrorResult = (error: unknown) => ({
    success: false as const,
    error: error instanceof Error ? error : new Error(String(error)),
  })

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem('smo_token', data.accessToken)
      localStorage.setItem('smo_refresh', data.refreshToken)

      setUser(data.user)
      setIsLoggedIn(true)

      return { success: true, user: data.user }
    } catch (error) {
      return createErrorResult(error)
    }
  }

  const signUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          username: name,
        }),
      })

      localStorage.setItem('smo_token', data.accessToken)
      localStorage.setItem('smo_refresh', data.refreshToken)

      setUser(data.user)
      setIsLoggedIn(true)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('SIGNUP ERROR:', error)

      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error(String(error)),
      }
    }
  }

  const signOut = async () => {
    try {
      await request('/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.warn('Logout request failed:', error)
    }

    localStorage.removeItem('smo_token')
    localStorage.removeItem('smo_refresh')
    setUser(null)
    setIsLoggedIn(false)
  }

  return {
    user,
    isLoggedIn,
    loading,
    signIn,
    signUp,
    signOut,
  }
}