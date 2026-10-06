import { createMiddleware } from 'hono/factory'
import { ACCESS_TOKEN_HEADER, verifyAccessToken } from '../lib/access'
import { getConfig } from '../lib/config'
import { forbidden, HttpError } from '../lib/errors'

/** Environment of the admin part: the verified email of whoever passed Cloudflare Access */
export type AdminEnv = {
  Bindings: CloudflareBindings
  Variables: { adminEmail: string }
}

/**
 * Lets a request through only with a valid Cloudflare Access token for our application, from an
 * allowed email. Fails closed: missing settings, a missing or invalid token, or another email are
 * all refused. The reason is logged (never the token).
 */
export const requireAccess = createMiddleware<AdminEnv>(async (c, next) => {
  const { access, emails } = getConfig(c.env).admin
  if (!access) {
    console.error('Admin access refused: ACCESS_TEAM_DOMAIN or ACCESS_AUD is not set')
    throw new HttpError(500, 'SERVER_MISCONFIGURED', 'Admin access is not configured')
  }

  const token = c.req.header(ACCESS_TOKEN_HEADER)
  if (!token) {
    console.warn('Admin access refused: no Access token')
    throw forbidden()
  }

  const email = await verifyAccessToken(token, access.teamDomain, access.aud)
  if (!email) {
    console.warn('Admin access refused: invalid Access token')
    throw forbidden()
  }
  // Second check besides the Access policy: an allowed email only
  if (emails.length > 0 && !emails.includes(email)) {
    console.warn('Admin access refused: email not in ADMIN_EMAILS')
    throw forbidden()
  }

  c.set('adminEmail', email)
  await next()
})
