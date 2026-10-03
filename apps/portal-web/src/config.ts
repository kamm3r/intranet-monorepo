const environment = import.meta.env.MODE

// Canonical env names first, legacy *_DEV fallbacks second, port defaults last.
const apiUrl: string =
    import.meta.env.VITE_API_URL
    ?? import.meta.env.VITE_API_URL_DEV
    ?? 'http://localhost:4002'
const usersUrl: string =
    import.meta.env.VITE_USERS_URL
    ?? import.meta.env.VITE_USERS_URL_DEV
    ?? 'http://localhost:4001'
const domain: string =
    import.meta.env.VITE_DOMAIN
    ?? import.meta.env.VITE_DOMAIN_DEV
    ?? 'http://localhost:5172'

const usersWebUrl = import.meta.env.VITE_USERS_WEB_URL ?? 'http://localhost:5171'
const kuutioApiUrl = import.meta.env.VITE_KUUTIO_API_URL ?? 'http://localhost:4003/api'
const kuutioWebUrl = import.meta.env.VITE_KUUTIO_WEB_URL ?? 'http://localhost:5175'
const tyoaikaApiUrl = import.meta.env.VITE_TYOAIKA_API_URL ?? 'http://localhost:4004/api'
const tyoaikaWebUrl = import.meta.env.VITE_TYOAIKA_WEB_URL ?? 'http://localhost:5176'

export { environment, apiUrl, usersUrl, usersWebUrl, domain, kuutioApiUrl, kuutioWebUrl, tyoaikaApiUrl, tyoaikaWebUrl }
