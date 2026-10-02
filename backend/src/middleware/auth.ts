import { createMiddleware } from 'hono/factory'
import { createAuth } from '../auth'

type Session = ReturnType<typeof createAuth>['$Infer']['Session']

export type AppEnv = {
    Bindings: CloudflareBindings
    Variables: { user: Session['user']; session: Session['session'] }
}

/** Rejects requests without a valid session; otherwise exposes c.get('user') */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    const data = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers })
    if (!data) return c.json({ error: 'Unauthorized' }, 401)
    c.set('user', data.user)
    c.set('session', data.session)
    await next()
})
