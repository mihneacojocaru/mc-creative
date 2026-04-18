#!/usr/bin/env node
// ─── Raster → WebP converter + resizer ──────────────────────────────────────
// Scans `public/` for .png/.jpg/.jpeg assets and emits a sibling .webp for
// each one. Applies resize rules per path pattern so oversized sources get
// scaled down to sensible display dimensions (biggest LCP/Lighthouse win).
// Idempotent: skips files whose .webp is already up to date.
// Run via `npm run images` or automatically before `npm run build`.

import sharp from 'sharp'
import fg from 'fast-glob'
import { stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = 'public'
const DEFAULT_QUALITY = 82

// Favicons and touch icons must stay as PNG for platform compatibility.
const EXCLUDE = [
  '**/favicon*',
  '**/apple-touch-icon*',
  '**/android-chrome-*',
]

// ─── Resize rules ───────────────────────────────────────────────────────────
// First matching pattern wins. `max` is the longest edge (px); omit to keep
// the original size. `quality` overrides DEFAULT_QUALITY.
const RESIZE_RULES = [
  // Sidebar avatar: displayed 80×80, 2x for retina.
  { match: /portrait-sq-min\./i,           max: 160, quality: 80 },
  // Client logos: displayed ~240×128, 2x for retina.
  { match: /\/website-logos\/.*\.(png|jpe?g)$/i, max: 480, quality: 82 },
  // LCP portrait already sized appropriately (600×736) — leave as-is.
]

function ruleFor(file) {
  return RESIZE_RULES.find(r => r.match.test(file)) ?? {}
}

async function isUpToDate(src, out) {
  if (!existsSync(out)) return false
  const [s, o] = await Promise.all([stat(src), stat(out)])
  return o.mtimeMs >= s.mtimeMs
}

async function convert(file) {
  const out = file.replace(/\.(png|jpe?g)$/i, '.webp')
  if (await isUpToDate(file, out)) return { status: 'skipped' }

  const rule = ruleFor(file)
  const ext = path.extname(file).toLowerCase()
  let pipeline = sharp(file)

  if (rule.max) {
    pipeline = pipeline.resize({
      width: rule.max,
      height: rule.max,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const quality = rule.quality ?? DEFAULT_QUALITY
  const opts = ext === '.png'
    ? { quality, alphaQuality: 100, effort: 5 }
    : { quality, effort: 5 }

  await pipeline.webp(opts).toFile(out)
  return { status: 'wrote', out }
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
