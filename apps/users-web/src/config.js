const environment = import.meta.env.MODE;

// Canonical env names with legacy fallbacks.
// VITE_API_URL is preferred; VITE_API_URL_DEV / VITE_API_URL_PROD kept for backwards compat.
const apiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_URL_DEV ||
  import.meta.env.VITE_API_URL_PROD ||
  'http://localhost:4001/api';

// VITE_PORTAL_URL is preferred; defaults to portal-web dev port 5172.
const portalUrl =
  import.meta.env.VITE_PORTAL_URL ||
  import.meta.env.VITE_PORTAL_URL_DEV ||
  import.meta.env.VITE_PORTAL_URL_PROD ||
  'http://localhost:5172';

// Optional: direct users-api origin (without /api suffix). Falls back to apiUrl.
const usersUrl =
  import.meta.env.VITE_USERS_URL ||
  import.meta.env.VITE_USERS_URL_DEV ||
  import.meta.env.VITE_USERS_URL_PROD ||
  apiUrl;

export { apiUrl, environment, portalUrl, usersUrl };
