import { useSyncExternalStore } from "react";
import { getAccountProfile, getAccountStatus, subscribeAccountStatus } from "@/lib/progressSync";

export function useAccountStatus() {
  return useSyncExternalStore(subscribeAccountStatus, getAccountStatus);
}

export function useAccountProfile() {
  return useSyncExternalStore(subscribeAccountStatus, getAccountProfile);
}
