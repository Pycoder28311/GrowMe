import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function PrivacyScreen() {
    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <ThemedText type="subtitle">Privacy &amp; cookies</ThemedText>
                <ThemedText type="smallBold">Necessary cookies</ThemedText>
                <ThemedText>
                    better-auth.session_token: keeps you signed in. Set when you sign in, removed when you sign out
                    or after 7 days of inactivity. Required for the app to work, so it can&apos;t be turned off.
                </ThemedText>
                <ThemedText type="smallBold">Analytics cookies</ThemedText>
                <ThemedText>None yet. If we add any, we&apos;ll only use them with your consent.</ThemedText>
                <ThemedText type="smallBold">Your data</ThemedText>
                <ThemedText>
                    We store your account (name, email), your posts, comments and images. Contact: kopotitore@gmail.com
                </ThemedText>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    content: { width: '100%', maxWidth: MaxContentWidth, padding: Spacing.four, gap: Spacing.three },
});
