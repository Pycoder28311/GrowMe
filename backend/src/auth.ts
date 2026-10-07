// PROJECT file: which sign-in methods this app offers. Settings come from lib/config + lib/env.
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, emailOTP } from 'better-auth/plugins'
import { expo } from '@better-auth/expo'
import { getDb } from './db'
import * as schema from './db/schema'
import { resetPasswordEmail, signInCodeEmail, verifyEmail } from './emails'
import { getConfig } from './lib/config'
import { sendEmail } from './lib/email'
import { getEnv } from './lib/env'

const MAX_NAME = 60

/** A user's name as stored: trimmed; 400 when empty or longer than 60 characters */
function checkedName(name: string) {
    const trimmed = name.trim()
    if (trimmed.length === 0 || trimmed.length > MAX_NAME) {
        throw new APIError('BAD_REQUEST', { message: `The name must have 1 to ${MAX_NAME} characters` })
    }
    return trimmed
}

export const createAuth = (env: CloudflareBindings) => {
    const e = getEnv(env)
    const config = getConfig(env)

    return betterAuth({
        database: drizzleAdapter(getDb(env), { provider: 'sqlite', schema }),
        secret: e.BETTER_AUTH_SECRET,
        baseURL: e.BETTER_AUTH_URL,
        session: {
            cookieCache: { enabled: true, maxAge: 5 * 60 },
        },
        databaseHooks: {
            user: {
                // Names show on posts and comments: 1–60 characters. A new account's name is shortened
                // (a long Google name must not block sign-in); a change from the profile is refused
                create: {
                    before: async (user) => ({ data: { ...user, name: user.name.trim().slice(0, MAX_NAME) || 'Χρήστης' } }),
                },
                update: {
                    before: async (user) =>
                        typeof user.name === 'string' ? { data: { ...user, name: checkedName(user.name) } } : { data: user },
                },
            },
        },
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true, // no password sign-in until the email is confirmed
            resetPasswordTokenExpiresIn: 60 * 60, // link valid for 1 hour
            revokeSessionsOnPasswordReset: true, // sign out everywhere after a reset
            async sendResetPassword({ user, url }) {
                await sendEmail(env, { to: user.email, ...resetPasswordEmail(config, url) })
            },
        },
        emailVerification: {
            sendOnSignUp: true, // email a confirmation link right after sign-up
            sendOnSignIn: true, // send a new link if an unverified user tries to sign in
            autoSignInAfterVerification: true, // the link also signs them in
            async sendVerificationEmail({ user, url }) {
                await sendEmail(env, { to: user.email, ...verifyEmail(config, url) })
            },
        },
        // Google sign-in only when both keys are configured
        socialProviders:
            e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET
                ? {
                      google: {
                          clientId: e.GOOGLE_CLIENT_ID,
                          clientSecret: e.GOOGLE_CLIENT_SECRET,
                          prompt: 'select_account', // let users pick which Google account to use
                      },
                  }
                : {},
        plugins: [
            admin(), // user.role ("user" by default, "admin"), bans, impersonation
            emailOTP({
                otpLength: 6,
                expiresIn: 10 * 60,
                disableSignUp: true, // codes only sign in existing accounts
                async sendVerificationOTP({ email, otp, type }) {
                    if (type !== 'sign-in') return
                    await sendEmail(env, { to: email, ...signInCodeEmail(config, otp) })
                },
            }),
            // Mobile app support only for projects with an app URL scheme
            ...(config.appScheme ? [expo()] : []),
        ],
        trustedOrigins: config.trustedOrigins,
        advanced: {
            defaultCookieAttributes: { sameSite: 'none', secure: true },
        },
    })
}

export type Auth = ReturnType<typeof createAuth>
export type SessionUser = Auth['$Infer']['Session']['user']
export type SessionData = Auth['$Infer']['Session']['session']
