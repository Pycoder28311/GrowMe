import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordScreen() {
    const theme = useTheme();
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sendCode = async () => {
        setLoading(true);
        setError(null);
        const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim() });
        if (error) setError(error.message ?? 'Could not send the code');
        else setStep('reset');
        setLoading(false);
    };

    const resetPassword = async () => {
        setLoading(true);
        setError(null);
        const { error } = await authClient.emailOtp.resetPassword({
            email: email.trim(),
            otp: otp.trim(),
            password,
        });
        if (error) {
            setError(error.message ?? 'Could not reset the password');
            setLoading(false);
            return;
        }
        // Password changed: sign in right away with the new one
        const signIn = await authClient.signIn.email({ email: email.trim(), password });
        if (signIn.error) setError(signIn.error.message ?? 'Password changed. Please sign in.');
        setLoading(false);
    };

    const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.form}>
                <ThemedText type="subtitle">Reset password</ThemedText>

                {step === 'email' ? (
                    <>
                        <ThemedText themeColor="textSecondary">
                            Enter your email and we&apos;ll send you a 6-digit code.
                        </ThemedText>
                        <TextInput
                            style={input}
                            placeholder="Email"
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                            value={email}
                            onChangeText={setEmail}
                        />
                        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                        <Button
                            label={loading ? 'Sending...' : 'Send code'}
                            onPress={sendCode}
                            disabled={loading || !email.trim()}
                        />
                    </>
                ) : (
                    <>
                        <ThemedText themeColor="textSecondary">
                            If an account exists for {email.trim()}, we sent a code. Enter it with your new password.
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
                        <TextInput
                            style={input}
                            placeholder="New password (min. 8 characters)"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            autoComplete="new-password"
                            value={password}
                            onChangeText={setPassword}
                        />
                        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                        <Button
                            label={loading ? 'Saving...' : 'Set new password'}
                            onPress={resetPassword}
                            disabled={loading || otp.trim().length !== 6 || password.length < 8}
                        />
                        <Button label="Send a new code" onPress={sendCode} disabled={loading} />
                    </>
                )}

                <Link href="/sign-in">
                    <ThemedText type="linkPrimary">Back to sign in</ThemedText>
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
