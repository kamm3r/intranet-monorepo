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
    const networkError = new Error(`auth-client: network error (${error.message})`)
    networkError.cause = error
    throw networkError
  }
  const data = await parseBody(response)
  if (!response.ok) {
    const error = new Error(`auth-client: request failed with status ${response.status}`)
    error.response = { data, status: response.status }
    throw error
  }
  return { data, status: response.status, headers: response.headers }
}

export const createAuthClient = ({ apiBaseUrl, usersBaseUrl }) => {
  if (!apiBaseUrl) throw new Error('auth-client: apiBaseUrl is required')
  if (!usersBaseUrl) throw new Error('auth-client: usersBaseUrl is required')

  const url = `${apiBaseUrl}/authorize`
  let token = ''

  const setToken = (newToken) => {
    token = newToken ? `bearer ${newToken}` : null
  }

  // Fetch-style: returns headers only (use as `headers` in a fetch init).
  const requestConfig = () => {
    if (!token) return {}
    return { headers: { Authorization: token } }
  }

  const authHeaders = () => (token ? { Authorization: token } : {})

  const getToken = async (key) => {
    const { data } = await apiFetch(`${url}/${key}`)
    setToken(data.token)
    return data.token
  }

  const getUser = async () => {
    const { data } = await apiFetch(`${url}`, { headers: authHeaders() })
    return data
  }

  const logout = async () => {
    const response = await apiFetch(`${usersBaseUrl}/api/authorize/logout`, {
      headers: authHeaders(),
    })
    setToken('')
    return response
  }

  const getStoredHeader = () => token

  return { setToken, requestConfig, getToken, getUser, logout, getStoredHeader }
}

export default { createAuthClient }
