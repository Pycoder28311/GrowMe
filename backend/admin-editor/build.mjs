// Bundles the dashboard's article editor into src/resources/admin/editor.client.js (served as
// /admin-editor.js). Wrangler runs this before dev and deploy (wrangler.jsonc "build").
// The file is written only when it changes: wrangler watches src/ too, so rewriting an identical
// file would start another build, forever.
import { build } from 'esbuild'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const OUT = new URL('../src/resources/admin/editor.client.js', import.meta.url)

const result = await build({
  entryPoints: [new URL('./editor.ts', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  legalComments: 'none',
  write: false,
})
const code = result.outputFiles[0].text

if (existsSync(OUT) && readFileSync(OUT, 'utf8') === code) {
  console.log('admin editor: unchanged')
} else {
  writeFileSync(OUT, code)
  console.log(`admin editor: built (${Math.round(code.length / 1024)} KB)`)
}
