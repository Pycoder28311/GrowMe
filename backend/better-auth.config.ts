// backend/better-auth.config.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { expo } from '@better-auth/expo'
import { emailOTP } from 'better-auth/plugins'

export const auth = betterAuth({
    database: drizzleAdapter({} as never, { provider: 'sqlite' }),
    emailAndPassword: { enabled: true },
    plugins: [expo(), emailOTP({ async sendVerificationOTP() { } })],
})
