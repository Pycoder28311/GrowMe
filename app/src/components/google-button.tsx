import * as Linking from 'expo-linking';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

/** One button for both sign-up and sign-in with Google */
export function GoogleButton() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const continueWithGoogle = async () => {
        setLoading(true);
        setError(null);
        const { error } = await authClient.signIn.social({
            provider: 'google',
            callbackURL: Linking.createURL('/'), // back to the app (growme://, exp://) or the web page
        });
        if (error) setError(error.message ?? 'Google sign-in failed');
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Button
                label={loading ? 'Opening Google...' : 'Continue with Google'}
                onPress={continueWithGoogle}
                disabled={loading}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: Spacing.two },
    error: { color: '#e5484d' },
});
