/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_EVENTS_ENDPOINT?: string;
  readonly VITE_EVENTS_CHANNEL?: string;
  readonly VITE_EVENTS_API_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
