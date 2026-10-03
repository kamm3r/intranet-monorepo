import { apiUrl, usersUrl } from '../config'

const url: string = `${apiUrl}/authorize`
let token: string = ''

const parseBody = async (response: Response): Promise<any> => {
    const text = await response.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

interface ApiResponse {
    data: any
    status: number
    headers: Headers
}

const apiFetch = async (
    url: string,
    init: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
): Promise<ApiResponse> => {
    const { method = 'GET', headers = {}, body } = init
    let response: Response
    try {
        response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
    } catch (error) {
        throw new Error(`authorize: network error (${(error as Error).message})`)
    }
    const data = await parseBody(response)
    if (!response.ok) {
        const error = new Error(`authorize: request failed with status ${response.status}`) as Error & {
            response: { data: unknown; status: number }
        }
        error.response = { data, status: response.status }
        throw error
    }
    return { data, status: response.status, headers: response.headers }
}

// Two use cases:
// 1. Set token when we get it from the backend with a key.
// 2. Set the token from a cookie when the user loads the page.
const setToken = (newToken: string) => {
    token = newToken ? `bearer ${newToken}` : ''
}

// Fetch-style: returns headers only (use as `headers` in a fetch init).
const requestConfig = () => {
    if (!token) return {}
    return { headers: { 'Authorization': token } }
}

const authHeaders = (): Record<string, string> =>
    token ? { 'Authorization': token } : {}

// Get token from the backend using the key.
const getToken = async (key: string | null) => {
    const { data } = await apiFetch(`${url}/${key}`)

    setToken(data.token)

    return data.token
}

// get the user saved into the token.
const getUser = async () => {
    const { data } = await apiFetch(
        `${usersUrl}/api/authorize`, { headers: authHeaders() }
    )

    return data
}

const logout = async () => {
    const response = await apiFetch(
        `${usersUrl}/api/authorize/logout`, { headers: authHeaders() }
    )

    setToken('')

    return response
}

export default { setToken, requestConfig, getToken, getUser, logout }
