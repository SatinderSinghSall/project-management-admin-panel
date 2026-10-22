import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createAdminApi } from "./adminApi";

export default function useAdminAuthorization() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) return;

    if (!isSignedIn) {
      setStatus("signed-out");
      return;
    }

    setStatus("checking");

    const api = createAdminApi(getToken);

    api
      .verifyAccess()
      .then((result) => {
        if (cancelled) return;

        setStatus(result?.authorized === true ? "authorized" : "unauthorized");
      })
      .catch((error) => {
        if (cancelled) return;

        if (error.status === 401 || error.status === 403) {
          setStatus("unauthorized");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return { isLoaded, isSignedIn, status };
}
