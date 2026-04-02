import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { normalizeSitePath } from './lib/shared/site-path.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeSitePath(env.VITE_SITE_BASE_PATH)
  const appName = env.VITE_APP_NAME || 'Truthwatcher'
  const appDescription =
    env.VITE_APP_DESCRIPTION ||
    "Track Brandon Sanderson's writing progress and your Cosmere reading list."

  return {
    base,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        devOptions: {
          enabled: true,
          type: 'module',
        },
        manifest: {
          name: appName,
          short_name: appName,
          description: appDescription,
          theme_color: '#122620',
          background_color: '#f4efe7',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}icons/icon-512.png`,
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
  }
})
