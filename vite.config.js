import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const basePath = process.env.VITE_BASE_PATH || '/';

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
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
