import { apiFetch } from "./fetchClient";

import { apiUrl } from "../config";

const url = `${apiUrl}/authorize`;

let token = null;

// Fetch-style: returns headers only (use as `headers` in a fetch init).
// Sends the Authorization token if it has been defined.
export const config = () => {
  if (!token) return {};

  return { headers: { Authorization: token } };
};

const authHeaders = () => (token ? { Authorization: token } : {});

const setToken = (newToken) => {
  if (newToken) token = `bearer ${newToken}`;
  else token = null;
};

// Authorize the user to use the service on the domain. Use this
// function when the user is already logged in to the user-service
// and therefore they dont need to authenticate themselves again.
const authorizeForService = async (domain) => {
  const response = await apiFetch(`${url}/app/${domain}`, {
    headers: authHeaders(),
  });

  return response.data;
};

// Logout the user from the user-service.
const logout = async () => {
  const response = await apiFetch(`${url}/logout`, { headers: authHeaders() });

  setToken(null);

  return response.data;
};

export default { setToken, authorizeForService, logout };
