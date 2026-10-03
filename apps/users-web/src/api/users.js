import { apiFetch } from "./fetchClient";
import commonService from "./common";
import { config } from "./authorize";

import { apiUrl } from "../config";

const service = "/users";
const url = apiUrl + service;

const authHeaders = () => config().headers ?? {};

const create = async (object) => commonService.post(object, service);

const update = async (id, object) => commonService.put(id, object, service);
const remove = async (id) => commonService.del(id, service);

const get = async () => {
  const response = await apiFetch(url, { headers: authHeaders() });

  return response.data;
};

const getAll = async () => {
  const response = await apiFetch(`${url}/all`, { headers: authHeaders() });

  return response.data;
};

export default { create, update, remove, get, getAll };
