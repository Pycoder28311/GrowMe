import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { expo } from '@better-auth/expo'
import { getDb } from './db'
import * as schema from './db/schema'
import { sendEmail } from './lib/email'

export const createAuth = (env: CloudflareBindings) =>
    betterAuth({
        database: drizzleAdapter(getDb(env), { provider: 'sqlite', schema }),
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL,
        emailAndPassword: { enabled: true },
        plugins: [
            expo(),
            emailOTP({
                otpLength: 6,
                expiresIn: 10 * 60, // 10 minutes
                async sendVerificationOTP({ email, otp, type }) {
                    if (type !== 'forget-password') return
                    await sendEmail(env, {
                        to: email,
                        subject: 'Your GrowMe password reset code',
                        text: `Your code is ${otp}. It expires in 10 minutes.\n\nIf you didn't ask to reset your password, you can ignore this email.`,
                    })
                },
            }),
        ],
        trustedOrigins: ['growme://', 'exp://', 'http://localhost:8081'],
        advanced: {
            defaultCookieAttributes: { sameSite: 'none', secure: true },
        },
    })
