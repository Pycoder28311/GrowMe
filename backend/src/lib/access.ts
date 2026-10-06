import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * Cloudflare Access: after someone passes the Access login, Cloudflare adds a signed token (JWT) to
 * every request it forwards, in the `Cf-Access-Jwt-Assertion` header. Verifying it proves the
 * request went through Access for OUR application, even when it reaches the Worker another way.
 * https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */
export const ACCESS_TOKEN_HEADER = 'cf-access-jwt-assertion'

// The team's public signing keys, fetched once per isolate and refreshed by jose when they rotate
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function keysFor(teamDomain: string) {
  let keys = keySets.get(teamDomain)
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`))
    keySets.set(teamDomain, keys)
  }
  return keys
}

/**
 * Returns the signed-in email when the token is valid: signed by the team's keys, issued by the team
 * domain, meant for this application (AUD) and not expired. Returns null otherwise (never throws).
 */
export async function verifyAccessToken(token: string, teamDomain: string, aud: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, keysFor(teamDomain), { issuer: teamDomain, audience: aud })
    return typeof payload.email === 'string' ? payload.email.toLowerCase() : null
  } catch {
    return null
  }
}
