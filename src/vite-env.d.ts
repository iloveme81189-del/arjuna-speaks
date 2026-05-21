/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_DRIVE_UPLOADS_FOLDER_ID?: string;
  readonly VITE_GOOGLE_DRIVE_REPORTS_FOLDER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
