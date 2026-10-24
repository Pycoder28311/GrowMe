import { createMiddleware } from 'hono/factory'
import { PUBLIC_READ_CACHE } from '../lib/crud'
import type { AppEnv } from './auth'

/**
 * Public GETs that send `s-maxage` (the plants, blogs, tips... and the search index) are kept in the
 * data center's cache (Workers Cache API) for that long, so the next requests are answered without
 * reading D1. Everything else (writes, personal data, auth) has no `s-maxage` and passes through.
 *
 * Mount it after CORS (the stored answer has no CORS headers; CORS adds the right ones for each caller)
 * and before the rate limit (cache hits don't count against it). It only works on a custom domain:
 * the Cache API does nothing on workers.dev. The admin's saves clear it (lib/purge.ts).
 */
/** Bump to drop everything cached, e.g. after editing the database directly (not through the admin) */
const CACHE_VERSION = 5

export const edgeCache = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.method !== 'GET') return next()
  const cache = caches.default
  // Only the URL is the key: cookies and Authorization don't matter for these public answers
  const key = new Request(`${c.req.url}${c.req.url.includes('?') ? '&' : '?'}_cv=${CACHE_VERSION}`, { method: 'GET' })

  const hit = await cache.match(key)
  if (hit) {
    // A copy, so the CORS middleware can still set its headers on it. Cloudflare's zone-wide «Browser Cache TTL»
    // (4 hours by default) rewrites max-age on cached answers: put the intended value back, so the app keeps
    // asking after 60 seconds
    const copy = new Response(hit.body, hit)
    copy.headers.set('Cache-Control', PUBLIC_READ_CACHE)
    return copy
  }

  await next()
  const res = c.res
  if (res.status === 200 && res.headers.get('Cache-Control')?.includes('s-maxage')) {
    c.executionCtx.waitUntil(cache.put(key, res.clone()))
  }
})
