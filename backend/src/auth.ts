import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { expo } from '@better-auth/expo'
import { getDb } from './db'
import * as schema from './db/schema'

export const createAuth = (env: CloudflareBindings) =>
    betterAuth({
        database: drizzleAdapter(getDb(env), { provider: 'sqlite', schema }),
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL,        // your Worker's URL
        emailAndPassword: { enabled: true },
        plugins: [expo()],
        trustedOrigins: ['growme://', 'http://localhost:8081'],
    })
