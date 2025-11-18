/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string
  readonly VITE_BACKEND_API_URL: string
  readonly VITE_POSTHOG_KEY: string
  // Add other env vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
