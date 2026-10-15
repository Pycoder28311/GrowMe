/**
 * Clears everything Cloudflare has cached for the API's host, after the admin changes data, so the next
 * request reads the new data (the edge cache would otherwise keep the old answers up to their s-maxage).
 * Admin saves are rare, so clearing the whole host is simpler than listing every URL (lists have many
 * query variants). Does nothing until CF_PURGE_TOKEN, CF_ZONE_ID and API_HOST are set.
 */
export async function purgeApiCache(env: CloudflareBindings) {
  const { CF_PURGE_TOKEN, CF_ZONE_ID, API_HOST } = env
  if (!CF_PURGE_TOKEN || !CF_ZONE_ID || !API_HOST) return
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_PURGE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hosts: [API_HOST] }),
    })
    if (!res.ok) console.error('Cache purge failed', res.status, await res.text())
  } catch (error) {
    console.error('Cache purge failed', error)
  }
}
