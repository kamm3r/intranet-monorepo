import { apiFetch } from "./fetchClient";

import { apiUrl } from "../config";

const reset = async (user) => {
  try {
    const response = await apiFetch(`${apiUrl}/reset`, {
      method: "POST",
      body: user,
    });

    return response.data;
  } catch (exception) {
    return { error: exception.response?.data?.error || "Salasanan vaihtopyyntö epäonnistui." };
  }
};

export default { reset };
