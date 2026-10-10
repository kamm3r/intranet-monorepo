const environment = import.meta.env.MODE

// Canonical vars first, legacy _DEV fallbacks second, hardcoded defaults last.
let apiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_URL_DEV ||
  'http://localhost:4004'

let usersUrl =
  import.meta.env.VITE_USERS_URL ||
  import.meta.env.VITE_USERS_URL_DEV ||
  'http://localhost:4001'

let domain =
  import.meta.env.VITE_DOMAIN ||
  import.meta.env.VITE_DOMAIN_DEV ||
  'http://localhost:5176'

if (environment === 'production') {
  apiUrl = import.meta.env.VITE_API_URL_PROD || apiUrl
  usersUrl = import.meta.env.VITE_USERS_URL_PROD || usersUrl
  domain = import.meta.env.VITE_DOMAIN_PROD || domain
}

const usersWebUrl = import.meta.env.VITE_USERS_WEB_URL || 'http://localhost:5171'
const portalWebUrl = import.meta.env.VITE_PORTAL_WEB_URL || 'http://localhost:5172'

export { environment, apiUrl, usersUrl, usersWebUrl, portalWebUrl, domain }

export const kuutioWebUrl = import.meta.env.VITE_KUUTIO_WEB_URL || "http://localhost:5175"
