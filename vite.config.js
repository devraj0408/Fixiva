import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // bind explicitly to IPv4 localhost to avoid some Windows configs
    // where localhost resolves to IPv6 (::1) and the browser prefers IPv4.
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor.react';
            if (id.includes('lucide-react') || id.includes('lucide')) return 'vendor.icons';
            if (id.includes('framer-motion')) return 'vendor.motion';
            if (id.includes('@supabase') || id.includes('supabase')) return 'vendor.supabase';
            return 'vendor';
          }
        }
      }
    }
  },
})
