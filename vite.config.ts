import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plain HTTP so any LAN device can open the app without a TLS warning.
// (Browser camera scanning needs HTTPS/localhost — in-app upload-image and
// manual-entry verification always work over the LAN.)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    host: true,
  }
})