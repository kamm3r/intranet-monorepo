const environment = import.meta.env.MODE
const isProduction = environment === 'production'

// Canonical vars first, legacy _DEV/_PROD suffixed vars as fallback, then local defaults.
const apiUrl =
  import.meta.env.VITE_API_URL ??
  (isProduction ? import.meta.env.VITE_API_URL_PROD : import.meta.env.VITE_API_URL_DEV) ??
  'http://localhost:4003/api'

const usersUrl =
  import.meta.env.VITE_USERS_URL ??
  (isProduction ? import.meta.env.VITE_USERS_URL_PROD : import.meta.env.VITE_USERS_URL_DEV) ??
  'http://localhost:4001'

const domain =
  import.meta.env.VITE_DOMAIN ??
  (isProduction ? import.meta.env.VITE_DOMAIN_PROD : import.meta.env.VITE_DOMAIN_DEV) ??
  'http://localhost:5175'

const usersWebUrl = import.meta.env.VITE_USERS_WEB_URL ?? 'http://localhost:5171'
const portalWebUrl = import.meta.env.VITE_PORTAL_WEB_URL ?? 'http://localhost:5172'

export { environment, apiUrl, usersUrl, usersWebUrl, portalWebUrl, domain }

export const tyoaikaWebUrl = import.meta.env.VITE_TYOAIKA_WEB_URL || "http://localhost:5176"
