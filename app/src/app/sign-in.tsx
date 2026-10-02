// sign-in.tsx
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

export default function SignInScreen() {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const signIn = async () => {
        setLoading(true);
        setError(null);
        const { error } = await authClient.signIn.email({ email: email.trim(), password });
        if (error) setError(error.message ?? 'Sign in failed');
        setLoading(false);
    };

    const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.form}>
                <ThemedText type="subtitle">Sign in</ThemedText>
                <TextInput style={input} placeholder="Email" placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none" keyboardType="email-address" autoComplete="email"
                    value={email} onChangeText={setEmail} />
                <TextInput style={input} placeholder="Password" placeholderTextColor={theme.textSecondary}
                    secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} />
                {error && <ThemedText style={styles.error}>{error}</ThemedText>}
                <Button label={loading ? 'Signing in...' : 'Sign in'} onPress={signIn} disabled={loading} />
                <Link href="/sign-up"><ThemedText type="linkPrimary">No account? Sign up</ThemedText></Link>
            </SafeAreaView>
        </ThemedView>
    );
}

export const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    form: { width: '100%', maxWidth: 400, padding: Spacing.four, gap: Spacing.three },
    input: { fontSize: 16, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.two },
    error: { color: '#e5484d' },
});
