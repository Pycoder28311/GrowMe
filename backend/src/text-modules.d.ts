/** Browser scripts bundled as text (wrangler.jsonc "rules"), e.g. resources/admin/admin.client.js */
declare module '*.client.js' {
  const source: string
  export default source
}
