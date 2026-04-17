import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'

/**
 * Entfernt HTML-Kommentare aus dem ausgelieferten index.html
 * (Dev-Server und Build). Die Kommentare im Quellcode bleiben
 * als Referenz erhalten, sind aber im Browser (DevTools / View-Source)
 * nicht mehr sichtbar.
 * IE-Conditional-Comments (<!--[if ...]>) werden bewusst erhalten.
 */
function stripHtmlComments(): Plugin {
  return {
    name: 'strip-html-comments',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
        .replace(/^[ \t]*\n/gm, '')
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [tailwindcss(), stripHtmlComments()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
