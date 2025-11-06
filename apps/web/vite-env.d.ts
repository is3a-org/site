/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PRICE_ID_FULL: string;
  readonly VITE_STRIPE_PRICE_ID_FLEX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
