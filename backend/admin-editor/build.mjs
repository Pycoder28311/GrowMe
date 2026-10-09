// Bundles the dashboard's browser code written in TypeScript into src/resources/admin/*.client.js:
//   editor.ts  → editor.client.js  (/admin-editor.js: the article editor and blog-link boxes)
//   widgets.ts → widgets.client.js (/admin-widgets.js: the sun bar and duration boxes)
// Wrangler runs this before dev and deploy (wrangler.jsonc "build").
// A file is written only when it changes: wrangler watches src/ too, so rewriting an identical
// file would start another build, forever.
import { build } from 'esbuild'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const BUNDLES = [
  { name: 'admin editor', entry: './editor.ts', out: '../src/resources/admin/editor.client.js' },
  { name: 'admin widgets', entry: './widgets.ts', out: '../src/resources/admin/widgets.client.js' },
]

for (const bundle of BUNDLES) {
  const out = new URL(bundle.out, import.meta.url)
  const result = await build({
    entryPoints: [new URL(bundle.entry, import.meta.url).pathname],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2022',
    legalComments: 'none',
    write: false,
  })
  const code = result.outputFiles[0].text

  if (existsSync(out) && readFileSync(out, 'utf8') === code) {
    console.log(`${bundle.name}: unchanged`)
  } else {
    writeFileSync(out, code)
    console.log(`${bundle.name}: built (${Math.round(code.length / 1024)} KB)`)
  }
}
