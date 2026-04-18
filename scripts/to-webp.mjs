#!/usr/bin/env node
// ─── Raster → WebP converter ────────────────────────────────────────────────
// Scans `public/` for .png/.jpg/.jpeg assets and emits a sibling .webp for
// each one. Idempotent: skips files whose .webp is already up to date.
// Run manually via `npm run images` or automatically before `npm run build`.

import sharp from 'sharp'
import fg from 'fast-glob'
import { stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = 'public'
const QUALITY = 82
// Favicons and touch icons must stay as PNG for platform compatibility.
const EXCLUDE = [
  '**/favicon*',
  '**/apple-touch-icon*',
  '**/android-chrome-*',
]

async function isUpToDate(src, out) {
  if (!existsSync(out)) return false
  const [s, o] = await Promise.all([stat(src), stat(out)])
  return o.mtimeMs >= s.mtimeMs
}

async function convert(file) {
  const out = file.replace(/\.(png|jpe?g)$/i, '.webp')
  if (await isUpToDate(file, out)) return { file, status: 'skipped' }

  const ext = path.extname(file).toLowerCase()
  const pipeline = sharp(file)
  // Preserve PNG transparency; JPEG gets smooth WebP lossy.
  const opts = ext === '.png'
    ? { quality: QUALITY, alphaQuality: 100, effort: 5 }
    : { quality: QUALITY, effort: 5 }

  await pipeline.webp(opts).toFile(out)
  return { file, status: 'wrote', out }
}

const files = await fg(`${ROOT}/**/*.{png,jpg,jpeg}`, { ignore: EXCLUDE })

if (files.length === 0) {
  console.log('[to-webp] No source images found.')
  process.exit(0)
}

const results = await Promise.all(files.map(convert))

const wrote = results.filter(r => r.status === 'wrote').length
const skipped = results.filter(r => r.status === 'skipped').length
console.log(`[to-webp] ${wrote} converted, ${skipped} up-to-date.`)
