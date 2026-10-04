import * as Linking from 'expo-linking';
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

export default function SignUpScreen() {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const signUp = async () => {
        setLoading(true);
        setError(null);
        const { error } = await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: Linking.createURL('/'), // where the confirmation link brings them back
        });
        if (error) setError(error.message ?? 'Sign up failed');
        else setSent(true);
        setLoading(false);
    };

    if (sent) {
        return (
            <ThemedView style={styles.container}>
                <SafeAreaView style={styles.form}>
                    <ThemedText type="subtitle">Check your email</ThemedText>
                    <ThemedText themeColor="textSecondary">
                        We sent a confirmation link to {email.trim()}. Open it on this device to finish signing up.
                    </ThemedText>
                    <Link href="/sign-in">
                        <ThemedText type="linkPrimary">Back to sign in</ThemedText>
                    </Link>
                </SafeAreaView>
            </ThemedView>
        );
    }

    const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.form}>
                <ThemedText type="subtitle">Create account</ThemedText>
                <TextInput
                    style={input}
                    placeholder="Name"
                    placeholderTextColor={theme.textSecondary}
                    autoComplete="name"
                    value={name}
                    onChangeText={setName}
                />
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
                <TextInput
                    style={input}
                    placeholder="Password (min. 8 characters)"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                />
                {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                <Button
                    label={loading ? 'Creating account...' : 'Sign up'}
                    onPress={signUp}
                    disabled={loading || !name.trim() || !email.trim() || password.length < 8}
                />

                <GoogleButton />

                <Link href="/sign-in">
                    <ThemedText type="linkPrimary">Already have an account? Sign in</ThemedText>
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
