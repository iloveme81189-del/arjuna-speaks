import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev mode uses direct Groq API (VITE_GROQ_API_KEY in .env)
  // Production uses Vercel serverless proxy at /api/proxy (no API key exposed to browser)
})
