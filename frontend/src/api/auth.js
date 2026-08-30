/**
 * auth.js — Reusable Authentication API Service
 *
 * This module handles all network communication between the React frontend
 * and the Express backend for User Registration and User Login.
 *
 * Why use a separate API module?
 * 1. Separation of Concerns: Keeps UI components focused on visual layout & user interactions.
 * 2. Reusability: Auth logic can be called from anywhere in the app without rewriting fetch calls.
 * 3. Centralized Configuration: If the backend API URL changes, we only need to update it here once.
 */

// Base URL of our Express backend server
const API_BASE_URL = 'http://localhost:5000'

/**
 * Register a new user account.
 * @param {Object} credentials - { name, email, password }
 * @returns {Promise<Object>} The server response data containing user info
 */
export async function signupUser({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      password: password,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create account. Please try again.')
  }

  return data
}

/**
 * Authenticate an existing user and retrieve a JWT token.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} The server response containing { token, user }
 */
export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim(),
      password: password,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Invalid email or password.')
  }

  // Save the JWT token and user profile in localStorage
  if (data.token) {
    localStorage.setItem('token', data.token)
  }
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  return data
}

/**
 * Retrieve the currently logged-in user from localStorage.
 * @returns {Object|null} The stored user object or null if not logged in
 */
export function getStoredUser() {
  const savedUser = localStorage.getItem('user')
  const savedToken = localStorage.getItem('token')

  if (savedUser && savedToken) {
    try {
      return JSON.parse(savedUser)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Retrieve the saved JWT token from localStorage.
 * @returns {string|null} The JWT token string or null
 */
export function getStoredToken() {
  return localStorage.getItem('token')
}

/**
 * Log out the current user by clearing stored credentials.
 */
export function logoutUser() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
