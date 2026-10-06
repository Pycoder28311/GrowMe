import { getEnv } from './env'

export type AppConfig = {
  /** Shown to users, e.g. in email subjects */
  appName: string
  /** Mobile app URL scheme (e.g. "growme"); undefined for projects without a mobile app */
  appScheme: string | undefined
  /** Websites allowed to call the API from a browser (CORS + CSRF) */
  webOrigins: string[]
  /** Everything Better Auth may redirect to or accept requests from */
  trustedOrigins: string[]
  /** True when the backend itself runs on localhost */
  isDev: boolean
  /**
   * The admin dashboard: served only on `host`, behind Cloudflare Access. `access` is null until
   * ACCESS_TEAM_DOMAIN and ACCESS_AUD are set, and then the admin part refuses every request.
   */
  admin: {
    host: string | undefined
    emails: string[]
    access: { teamDomain: string; aud: string } | null
  }
}

const cache = new WeakMap<object, AppConfig>()

/** Project settings derived from the validated environment (cached per isolate) */
export function getConfig(env: CloudflareBindings): AppConfig {
  const cached = cache.get(env)
  if (cached) return cached

  const e = getEnv(env)
  const webOrigins = e.WEB_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const isDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(e.BETTER_AUTH_URL)

  const config: AppConfig = {
    appName: e.APP_NAME,
    appScheme: e.APP_SCHEME,
    webOrigins,
    trustedOrigins: [
      ...(e.APP_SCHEME ? [`${e.APP_SCHEME}://`] : []),
      ...webOrigins,
      ...(isDev ? ['exp://'] : []), // Expo Go only while developing locally
    ],
    isDev,
    admin: {
      host: e.ADMIN_HOST,
      emails: e.ADMIN_EMAILS.split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
      access:
        e.ACCESS_TEAM_DOMAIN && e.ACCESS_AUD
          ? { teamDomain: e.ACCESS_TEAM_DOMAIN.replace(/\/$/, ''), aud: e.ACCESS_AUD }
          : null,
    },
  }
  cache.set(env, config)
  return config
}
