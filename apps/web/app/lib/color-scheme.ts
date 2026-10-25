import { useSyncExternalStore } from "react";

export type ColorScheme = "system" | "light" | "dark";

const storageKey = "is3a-color-scheme";
const darkQuery = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

/**
 * Runs in the document head before first paint, so a stored dark preference never flashes light.
 * Keep the logic in step with applyColorScheme.
 */
export const colorSchemeScript = `try{var s=localStorage.getItem("${storageKey}");document.documentElement.classList.toggle("dark",s==="dark"||(s!=="light"&&matchMedia("${darkQuery}").matches))}catch(e){}`;

function readColorScheme(): ColorScheme {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Storage can be unavailable, for example with cookies blocked; fall back to the system theme.
    return "system";
  }
}

function applyColorScheme(scheme: ColorScheme): void {
  const dark = scheme === "dark" || (scheme === "system" && matchMedia(darkQuery).matches);
  document.documentElement.classList.toggle("dark", dark);
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setColorScheme(scheme: ColorScheme): void {
  try {
    if (scheme === "system") {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, scheme);
    }
  } catch {
    // Without storage the choice still applies until the page is reloaded.
  }
  applyColorScheme(scheme);
  notify();
}

function subscribe(listener: () => void): () => void {
  const media = matchMedia(darkQuery);
  // Follow the operating system while on "system", and choices made in other tabs.
  const sync = (): void => {
    applyColorScheme(readColorScheme());
    listener();
  };
  listeners.add(listener);
  media.addEventListener("change", sync);
  globalThis.addEventListener("storage", sync);
  return (): void => {
    listeners.delete(listener);
    media.removeEventListener("change", sync);
    globalThis.removeEventListener("storage", sync);
  };
}

/** The stored choice. Server rendering assumes "system"; the client corrects it after hydration. */
export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, readColorScheme, () => "system");
}
