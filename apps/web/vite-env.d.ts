/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CF_TURNSTILE_SITE_KEY: string;
  readonly VITE_STRIPE_PRICE_ID_FULL: string;
  readonly VITE_STRIPE_PRICE_ID_FLEX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
