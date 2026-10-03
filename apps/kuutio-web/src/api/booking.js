import { apiUrl } from '../config'
import { requestConfig } from './authorize'

const url = `${apiUrl}/booking`

const authHeaders = () => requestConfig().headers ?? {}

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
		throw new Error(`booking: network error (${error.message})`)
	}
	const data = await parseBody(response)
	if (!response.ok) {
		const error = new Error(typeof data === 'object' && data?.message ? data.message : `Varauspalvelu vastasi virheellä ${response.status}.`)
		error.response = { data, status: response.status }
		throw error
	}
	return { data, status: response.status, headers: response.headers }
}

const create = async object => apiFetch(
	url, { method: 'POST', headers: authHeaders(), body: object }
)

const getAll = async () => {
    const response = await apiFetch(
        `${url}/getbookings`, { headers: authHeaders() }
    )

    return response
}

const getByDate = async date => {
    const response = await apiFetch(
        `${url}/getbookings/${date}`, { headers: authHeaders() }
    )

    return response
}

const remove = async id => {
    const response = await apiFetch(
        `${url}/${id}`, { method: 'DELETE', headers: authHeaders() }
    )

    return response
}

export default { create, getAll, remove, getByDate }
