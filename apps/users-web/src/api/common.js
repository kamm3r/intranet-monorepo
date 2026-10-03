import { apiFetch } from "./fetchClient";
import { config } from "./authorize";
import { apiUrl } from "../config";
const url = apiUrl;

const authHeaders = () => config().headers ?? {};

const getAll = async (service) => {
  const completeUrl = url + service;

  const response = await apiFetch(completeUrl, { headers: authHeaders() });

  console.log("got response!");
  return response.data;
};

const get = async (id, service) => {
  const response = await apiFetch(url + service + `/${id}`, {
    headers: authHeaders(),
  });

  return response.data;
};

const post = async (object, service) => {
  const response = await apiFetch(url + service, {
    method: "POST",
    headers: authHeaders(),
    body: object,
  });

  return response.data;
};

const put = async (id, object, service) => {
  const response = await apiFetch(url + service + `/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: object,
  });

  return response.data;
};

const del = async (id, service) => {
  const response = await apiFetch(url + service + `/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return response.data;
};

export default { getAll, get, post, put, del };
