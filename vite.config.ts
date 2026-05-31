import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const basePath =
    process.env.VITE_BASE_PATH ??
    (mode === 'production' && repoName ? `/${repoName}/` : '/')

  return {
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'app-icon.svg',
          'app-icon-maskable.svg',
          'books/*.json',
          'schemas/*.json',
        ],
        manifest: {
          name: 'Bookscape',
          short_name: 'Bookscape',
          description:
            'A local-first PWA for reading AI-generated books as connected knowledge maps.',
          theme_color: '#08101c',
          background_color: '#08101c',
          display: 'standalone',
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: 'app-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'app-icon-maskable.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,json}'],
        },
      }),
    ],
  }
})
