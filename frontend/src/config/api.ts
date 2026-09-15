/**
 * Centralized API configuration for AIVOA Pharma QMS
 * Supports both local proxy and deployed production backend URL (e.g. https://aivoa-rbn6.vercel.app)
 */

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (!API_BASE) {
    return cleanEndpoint
  }
  return `${API_BASE}${cleanEndpoint}`
}
