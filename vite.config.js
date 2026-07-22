import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const basePath = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.BASE_URL || '/') : '/';

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

          // Split admin components into separate chunk
          if (id.includes('components/admin/')) {
            const match = id.match(/admin\/(\w+)/);
            if (match) {
              return `admin-${match[1].toLowerCase()}`;
            }
            return 'admin.modules';
          }

          // Split pages into separate chunks
          if (id.includes('pages/dashboard/')) {
            const match = id.match(/dashboard\/(\w+)/);
            if (match) {
              return `dashboard-${match[1].toLowerCase()}`;
            }
            return 'dashboards';
          }

          // Group auth pages
          if (id.includes('pages/auth/')) {
            return 'auth.pages';
          }

          // Group legal pages
          if (id.includes('pages/legal/')) {
            return 'legal.pages';
          }
        }
      }
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 600,
    // Use Vite's default minifier to avoid optional dependency issues
    minify: 'esbuild',
  },
})
