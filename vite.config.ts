import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'הבית שלנו',
        short_name: 'הבית שלנו',
        description: 'ניהול והשוואת נכסים משותפת',
        theme_color: '#173f35',
        background_color: '#f6f3ed',
        display: 'standalone',
        start_url: '/',
        lang: 'he',
        dir: 'rtl',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
