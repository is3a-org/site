import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function subscribeToMobileViewport(onChange: () => void): () => void {
  const mediaQuery = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mediaQuery.addEventListener("change", onChange);
  return (): void => {
    mediaQuery.removeEventListener("change", onChange);
  };
}

function getMobileViewportSnapshot(): boolean {
  return globalThis.innerWidth < MOBILE_BREAKPOINT;
}

function getServerMobileViewportSnapshot(): boolean {
  return false;
}

/** Reports the mobile viewport after hydration and subscribes to breakpoint changes. */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );
}
