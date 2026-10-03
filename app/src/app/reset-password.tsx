import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

export default function ResetPasswordScreen() {
    const theme = useTheme();
    const { token, error: linkError } = useLocalSearchParams<{ token?: string; error?: string }>();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const mismatch = confirm.length > 0 && password !== confirm;

    const save = async () => {
        if (!token || password !== confirm) return;
        setLoading(true);
        setError(null);
        const { error } = await authClient.resetPassword({ newPassword: password, token });
        setLoading(false);
        if (error) {
            setError(error.message ?? 'Could not reset the password');
            return;
        }
        router.replace('/sign-in');
    };

    // Opened without a valid token: expired, already used, or typed by hand
    if (!token || linkError) {
        return (
            <ThemedView style={styles.container}>
                <SafeAreaView style={styles.form}>
                    <ThemedText type="subtitle">Link not valid</ThemedText>
                    <ThemedText themeColor="textSecondary">
                        This reset link is invalid or has expired. Please request a new one.
                    </ThemedText>
                    <Link href="/forgot-password">
                        <ThemedText type="linkPrimary">Request a new link</ThemedText>
                    </Link>
                </SafeAreaView>
            </ThemedView>
        );
    }

    const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.form}>
                <ThemedText type="subtitle">Choose a new password</ThemedText>
                <TextInput
                    style={input}
                    placeholder="New password (min. 8 characters)"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    style={input}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoComplete="new-password"
                    value={confirm}
                    onChangeText={setConfirm}
                />
                {mismatch && <ThemedText style={styles.error}>Passwords don&apos;t match</ThemedText>}
                {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                <Button
                    label={loading ? 'Saving...' : 'Save new password'}
                    onPress={save}
                    disabled={loading || password.length < 8 || password !== confirm}
                />
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
