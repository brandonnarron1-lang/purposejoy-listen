import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer', // defer SW registration — removes render-blocking registerSW.js
      includeAssets: ['favicon.ico', 'icons/*.png', 'og/*.png'],
      manifest: false, // We manage manifest manually
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        runtimeCaching: [
          {
            // Cache both original and .webp variants from the cover worker
            urlPattern: /^\/api\/cover\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cover-art-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /^\/api\/(playlists|songs)\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' },
          },
          {
            urlPattern: /^\/api\/stream\//,
            handler: 'CacheFirst',
            method: 'GET',
            options: {
              cacheName: 'audio-cache',
              rangeRequests: true,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [200, 206],
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\/api\//, /^\/download\//, /^\/install/],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
})
