// Configuration constants
export const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8787' 
  : 'https://phasee-v1.vercel.app' // Your deployed Vercel URL

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_BASE}/api/auth/register`,
  LOGIN: `${API_BASE}/api/auth/login`,
  
  // User endpoints
  USER_PROFILE: (userId: string) => `${API_BASE}/api/users/${userId}`,
  
  // Brand profile endpoints
  BRAND_PROFILE: `${API_BASE}/api/brand-profile`,
  BRAND_PROFILE_GET: (userId: string) => `${API_BASE}/api/brand-profile/${userId}`,
  
  // Settings endpoints
  SETTINGS: `${API_BASE}/api/settings`,
  SETTINGS_GET: (userId: string) => `${API_BASE}/api/settings/${userId}`,
  
  // Content generation endpoints
  GENERATE: `${API_BASE}/api/generate`,
  OPTIMIZE: `${API_BASE}/api/optimize`,
  IDEAS: `${API_BASE}/api/ideas`,
} as const
