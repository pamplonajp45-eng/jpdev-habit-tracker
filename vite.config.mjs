import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'HABBITLOGO.png'],
      manifest: {
        name: 'Habit Tracker',
        short_name: 'HBT',
        description: 'Track your habits easily!',
        theme_color: '#4f46e5',
        background_color: '#0a0a15',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'HABBITLOGO.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'HABBITLOGO.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/'
})
