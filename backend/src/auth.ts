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
        emailAndPassword: {
            enabled: true,
            resetPasswordTokenExpiresIn: 60 * 60, // link valid for 1 hour
            revokeSessionsOnPasswordReset: true, // sign out everywhere after a reset
            async sendResetPassword({ user, url }) {
                await sendEmail(env, {
                    to: user.email,
                    subject: 'Reset your GrowMe password',
                    text: `Open this link to choose a new password (valid for 1 hour):\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
                })
            },
        },
        plugins: [
            expo(),
            emailOTP({
                otpLength: 6,
                expiresIn: 10 * 60,
                disableSignUp: true, // codes only sign in existing accounts
                async sendVerificationOTP({ email, otp, type }) {
                    if (type !== 'sign-in') return
                    await sendEmail(env, {
                        to: email,
                        subject: 'Your GrowMe sign-in code',
                        text: `Your code is ${otp}. It expires in 10 minutes.\n\nIf you didn't try to sign in, you can ignore this email.`,
                    })
                },
            }),
        ],
        trustedOrigins: ['growme://', 'exp://', 'http://localhost:8081'],
        advanced: {
            defaultCookieAttributes: { sameSite: 'none', secure: true },
        },
    })
