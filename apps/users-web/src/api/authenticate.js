import { apiFetch } from "./fetchClient";
import { apiUrl } from "../config";

const url = `${apiUrl}/authenticate`;

const authenticate = async (credentials) => {
  const response = await apiFetch(url, { method: "POST", body: credentials });

  return response.data;
};

const authenticateForService = async (credentials, domain) => {
  const response = await apiFetch(`${url}/${domain}`, {
    method: "POST",
    body: credentials,
  });

  return response.data;
};

export default { authenticate, authenticateForService };
