import { useSyncExternalStore } from "react";
import { getAccountStatus, subscribeAccountStatus } from "@/lib/progressSync";

export function useAccountStatus() {
  return useSyncExternalStore(subscribeAccountStatus, getAccountStatus);
}
