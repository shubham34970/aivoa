/**
 * Centralized API configuration for AIVOA Pharma QMS
 * Supports both local proxy and deployed production backend URL (https://aivoa-rbn6.vercel.app)
 */

export const getBaseApiUrl = (): string => {
  // 1. Explicit environment variable
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '')
  }

  // 2. In production (e.g. running on Vercel or cloud domain), fallback to live backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://aivoa-rbn6.vercel.app'
  }

  // 3. Local dev default (uses Vite proxy)
  return ''
}

export const API_BASE = getBaseApiUrl()

export const getApiUrl = (endpoint: string): string => {
  const base = getBaseApiUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (!base) {
    return cleanEndpoint
  }
  return `${base}${cleanEndpoint}`
}

/**
 * Safely parse JSON responses from backend, handling HTML 404 / 500 error pages gracefully
 */
export async function safeFetchJson<T = any>(res: Response): Promise<T> {
  const text = await res.text()
  
  if (!text || text.trim().length === 0) {
    if (!res.ok) {
      throw new Error(`Server returned HTTP error ${res.status}`)
    }
    return {} as T
  }

  let parsed: any = null
  try {
    parsed = JSON.parse(text)
  } catch {
    // Response is HTML or plain text (e.g. Vercel 404 "The page could not be found")
    if (!res.ok) {
      if (text.includes('The page could not be found') || res.status === 404) {
        throw new Error(`API endpoint not found (404). Please verify backend URL configuration at: ${getBaseApiUrl() || 'same-origin'}`)
      }
      throw new Error(`Server error (${res.status}): ${text.slice(0, 100)}`)
    }
    throw new Error(`Invalid response received from server: ${text.slice(0, 100)}`)
  }

  if (!res.ok) {
    const detail = parsed?.detail || parsed?.message || `Server error (${res.status})`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  return parsed as T
}
