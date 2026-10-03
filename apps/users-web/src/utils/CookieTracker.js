import { useEffect } from "react";
import Cookies from "universal-cookie";

import authorizeApi from "../api/authorize";
import userApi from "../api/users";
import { useStore } from "./store";

export function CookieTracker() {
  const { setUser, setAuthReady } = useStore();

  const loadCookies = async () => {
    const cookies = new Cookies();
    const usersToken = cookies.get("usersToken");

    try {
      if (usersToken) {
        authorizeApi.setToken(usersToken);
        try {
          setUser(await userApi.get());
        } catch {
          cookies.remove("usersToken");
          authorizeApi.setToken(null);
        }
      }
    } finally {
      setAuthReady(true);
    }
  };
  useEffect(() => {
    loadCookies();
  }, []);

  return null;
}
