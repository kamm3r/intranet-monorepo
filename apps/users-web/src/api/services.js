import { apiFetch } from "./fetchClient";

import commonService from "./common";
import { apiUrl } from "../config";

const service = "/services";
const url = apiUrl + service;

// Get all public information about the services.
const getAllPublic = async () => {
  const response = await apiFetch(`${url}/public`);

  return response.data;
};

const getAll = async () => commonService.getAll(service);
const create = async (object) => commonService.post(object, service);
const update = async (id, object) => commonService.put(id, object, service);
const remove = async (id) => commonService.del(id, service);

export default { getAllPublic, getAll, create, update, remove };
