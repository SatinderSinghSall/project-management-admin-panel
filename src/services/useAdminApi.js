import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";
import { createAdminApi } from "./adminApi";

export function useAdminApi() {
  const { getToken } = useAuth();
  return useMemo(() => createAdminApi(getToken), [getToken]);
}
