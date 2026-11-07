import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const read = () =>
  typeof window.matchMedia === "function" && window.matchMedia(query).matches;
function subscribe(listener) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

// The installed Motion hook captures only its initial value; this tracks live OS/browser changes.
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, read, () => false);
}
