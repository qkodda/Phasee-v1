// Simple authentication utilities for frontend
const AUTH_KEY = 'phasee.auth'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface BrandProfile {
  brandName: string
  yearFounded: string
  industry: string
  audience: string
  tone: string
  hasPhotography: boolean
  hasVideo: boolean
  hasDesign: boolean
  companyDescription?: string
  brandCulture?: string
  contentGoals?: string
}

export const auth = {
  // Get current user from localStorage
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  // Save user session
  setCurrentUser(user: User): boolean {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      return true
    } catch {
      return false
    }
  },

  // Clear user session
  logout(): void {
    localStorage.removeItem(AUTH_KEY)
  },

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null
  },

  // Get user ID
  getUserId(): string | null {
    const user = this.getCurrentUser()
    return user?.id || null
  }
}

// API helpers for user management
export const userAPI = {
  // Register new user
  async register(email: string, password: string, firstName = '', lastName = '') {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName })
    })
    const data = await response.json()
    
    if (response.ok) {
      auth.setCurrentUser(data.user)
      return { success: true, user: data.user }
    } else {
      return { success: false, error: data.error }
    }
  },

  // Login user
  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    
    if (response.ok) {
      auth.setCurrentUser(data.user)
      return { success: true, user: data.user }
    } else {
      return { success: false, error: data.error }
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>) {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const data = await response.json()
    
    if (response.ok) {
      // Update stored user data
      const currentUser = auth.getCurrentUser()
      if (currentUser) {
        auth.setCurrentUser({ ...currentUser, ...updates })
      }
      return { success: true }
    } else {
      return { success: false, error: data.error }
    }
  }
}

// API helpers for brand profiles
export const brandAPI = {
  // Get brand profile
  async getProfile(userId: string) {
    const response = await fetch(`/api/brand-profile/${userId}`)
    const data = await response.json()
    
    if (response.ok) {
      return { success: true, profile: data.profile }
    } else {
      return { success: false, error: data.error }
    }
  },

  // Save brand profile
  async saveProfile(userId: string, profile: BrandProfile) {
    const response = await fetch('/api/brand-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...profile })
    })
    const data = await response.json()
    
    if (response.ok) {
      return { success: true, profileId: data.profileId }
    } else {
      return { success: false, error: data.error }
    }
  }
}

// API helpers for settings
export const settingsAPI = {
  // Get user settings
  async getSettings(userId: string) {
    const response = await fetch(`/api/settings/${userId}`)
    const data = await response.json()
    
    if (response.ok) {
      return { success: true, settings: data.settings }
    } else {
      return { success: false, error: data.error }
    }
  },

  // Save setting
  async saveSetting(userId: string, settingKey: string, settingValue: any) {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, settingKey, settingValue })
    })
    const data = await response.json()
    
    if (response.ok) {
      return { success: true }
    } else {
      return { success: false, error: data.error }
    }
  }
}
