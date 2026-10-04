import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GoogleButton } from '@/components/google-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

type Mode = 'password' | 'code-email' | 'code-enter';
type AuthError = { message?: string; code?: string } | null;

const NOT_VERIFIED_MESSAGE = 'Please confirm your email first. We just sent you a new link.';

export default function SignInScreen() {
    const theme = useTheme();
    const [mode, setMode] = useState<Mode>('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function run(action: () => Promise<{ error: AuthError }>, fallback: string) {
        setLoading(true);
        setError(null);
        const { error } = await action();
        if (error) {
            setError(error.code === 'EMAIL_NOT_VERIFIED' ? NOT_VERIFIED_MESSAGE : (error.message ?? fallback));
        }
        setLoading(false);
        return !error;
    }

    const signInWithPassword = () =>
        run(() => authClient.signIn.email({ email: email.trim(), password }), 'Sign in failed');

    const sendCode = async () => {
        const ok = await run(
            () => authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: 'sign-in' }),
            'Could not send the code',
        );
        if (ok) setMode('code-enter');
    };

    const signInWithCode = () =>
        run(() => authClient.signIn.emailOtp({ email: email.trim(), otp: otp.trim() }), 'Invalid code');

    const switchMode = (next: Mode) => {
        setMode(next);
        setError(null);
        setOtp('');
    };

    const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.form}>
                <ThemedText type="subtitle">Sign in</ThemedText>

                <TextInput
                    style={input}
                    placeholder="Email"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                    editable={mode !== 'code-enter'}
                />

                {mode === 'password' && (
                    <>
                        <TextInput
                            style={input}
                            placeholder="Password"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            autoComplete="password"
                            value={password}
                            onChangeText={setPassword}
                        />
                        <Link href="/forgot-password">
                            <ThemedText type="link">Forgot password?</ThemedText>
                        </Link>
                        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                        <Button
                            label={loading ? 'Signing in...' : 'Sign in'}
                            onPress={signInWithPassword}
                            disabled={loading || !email.trim() || !password}
                        />
                        <Button label="Sign in with email code" onPress={() => switchMode('code-email')} />
                    </>
                )}

                {mode === 'code-email' && (
                    <>
                        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                        <Button
                            label={loading ? 'Sending...' : 'Send code'}
                            onPress={sendCode}
                            disabled={loading || !email.trim()}
                        />
                        <Button label="Use password instead" onPress={() => switchMode('password')} />
                    </>
                )}

                {mode === 'code-enter' && (
                    <>
                        <ThemedText themeColor="textSecondary">
                            If an account exists for {email.trim()}, we sent a 6-digit code.
                        </ThemedText>
                        <TextInput
                            style={input}
                            placeholder="6-digit code"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="number-pad"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                        />
                        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                        <Button
                            label={loading ? 'Signing in...' : 'Sign in'}
                            onPress={signInWithCode}
                            disabled={loading || otp.trim().length !== 6}
                        />
                        <Button label="Send a new code" onPress={sendCode} disabled={loading} />
                        <Button label="Use password instead" onPress={() => switchMode('password')} />
                    </>
                )}

                <GoogleButton />

                <Link href="/sign-up">
                    <ThemedText type="linkPrimary">No account? Sign up</ThemedText>
                </Link>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    form: { width: '100%', maxWidth: 400, padding: Spacing.four, gap: Spacing.three },
    input: {
        fontSize: 16,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.two,
    },
    error: { color: '#e5484d' },
});
