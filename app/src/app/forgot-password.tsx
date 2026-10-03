import * as Linking from 'expo-linking';
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
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sendLink = async () => {
        setLoading(true);
        setError(null);
        const { error } = await authClient.requestPasswordReset({
            email: email.trim(),
            // Where the email link should land: growme://… (app), exp://… (Expo Go) or http://… (web)
            redirectTo: Linking.createURL('/reset-password'),
        });
        if (error) setError(error.message ?? 'Could not send the email');
        else setSent(true);
        setLoading(false);
    };

    const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.form}>
                <ThemedText type="subtitle">Forgot password</ThemedText>
                {sent ? (
                    <ThemedText themeColor="textSecondary">
                        If an account exists for {email.trim()}, we sent a link to reset your password. Open it on
                        this device. It&apos;s valid for 1 hour.
                    </ThemedText>
                ) : (
                    <>
                        <ThemedText themeColor="textSecondary">
                            Enter your email and we&apos;ll send you a link to choose a new password.
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
                            label={loading ? 'Sending...' : 'Send reset link'}
                            onPress={sendLink}
                            disabled={loading || !email.trim()}
                        />
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
