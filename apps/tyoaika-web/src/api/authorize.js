import { apiUrl, usersUrl } from '../config'
import { readCookie } from './session'

const url = `${apiUrl}/api/authorize`
let token = ''
let keyExchange = null

// Two use cases:
// 1. Set token when we get it from the backend with a key.
// 2. Set the token from a cookie when the user loads the page.
const setToken = (newToken) => {
  if (newToken) token = `bearer ${newToken}`
  else token = null
}

// Fetch-style: returns headers only (use as `headers` in a fetch init).
export const requestConfig = () => {
  if (!token) {
    const saved = readCookie('tyoaikaToken') || readCookie('usersToken')
    if (saved) setToken(saved)
  }
  if (!token) return {}

  return { headers: { Authorization: token } }
}

const authHeaders = () => (token ? { Authorization: token } : {})

const parseBody = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const apiFetch = async (url, { method = 'GET', headers = {}, body } = {}) => {
  let response
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new Error(`authorize: network error (${error.message})`)
  }
  const data = await parseBody(response)
  if (!response.ok) {
    const error = new Error(`authorize: request failed with status ${response.status}`)
    error.response = { data, status: response.status }
    throw error
  }
  return { data, status: response.status, headers: response.headers }
}

// Get token from the backend using the key.
const getToken = (key) => {
  // A user_key is single use. React StrictMode can mount twice in development,
  // so both mounts must share the same redemption request.
  if (keyExchange?.key === key) return keyExchange.promise
  const promise = apiFetch(`${url}/${encodeURIComponent(key)}`).then(({ data }) => {
    setToken(data.token)
    return data.token
  })
  keyExchange = { key, promise }
  return promise
}

// get the user saved into the token.
const getUser = async () => {
  const { data } = await apiFetch(`${apiUrl}/api/authorize`, {
    headers: authHeaders(),
  })

  return data
}

const logout = async () => {
  const response = await apiFetch(
    `${usersUrl}/api/authorize/logout`,
    { headers: authHeaders() }
  )

  setToken('')

  return response
}

export default { setToken, requestConfig, getToken, getUser, logout }
