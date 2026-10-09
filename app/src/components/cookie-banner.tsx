import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { saveConsent, useConsentState } from '@/lib/consent';

export function CookieBanner() {
    const state = useConsentState();
    const [customizing, setCustomizing] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    if (Platform.OS !== 'web' || !state) return null;
    if (state.consent && !state.settingsOpen) return null;

    const showChoices = customizing || state.settingsOpen;

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">Cookies</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                    We use necessary cookies to keep you signed in. With your permission, we&apos;d also use
                    analytics cookies to improve Grow Here. You can change this anytime.{' '}
                    <Link href="/privacy">
                        <ThemedText type="small" style={styles.link}>Privacy &amp; cookie policy</ThemedText>
                    </Link>
                </ThemedText>

                {showChoices && (
                    <View style={styles.choices}>
                        <Choice label="Necessary" description="Sign-in and security. Always on." value disabled />
                        <Choice label="Analytics" description="Anonymous usage statistics." value={analytics} onChange={setAnalytics} />
                        <Choice label="Marketing" description="Personalized ads and campaigns." value={marketing} onChange={setMarketing} />
                    </View>
                )}

                <View style={styles.actions}>
                    <Button label="Reject all" onPress={() => saveConsent({ analytics: false, marketing: false })} />
                    {showChoices ? (
                        <Button label="Save choices" onPress={() => saveConsent({ analytics, marketing })} />
                    ) : (
                        <Button label="Customize" onPress={() => setCustomizing(true)} />
                    )}
                    <Button label="Accept all" onPress={() => saveConsent({ analytics: true, marketing: true })} />
                </View>
            </ThemedView>
        </View>
    );
}

function Choice(props: {
    label: string;
    description: string;
    value: boolean;
    disabled?: boolean;
    onChange?: (value: boolean) => void;
}) {
    return (
        <View style={styles.choice}>
            <View style={styles.choiceText}>
                <ThemedText type="smallBold">{props.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{props.description}</ThemedText>
            </View>
            <Switch value={props.value} disabled={props.disabled} onValueChange={props.onChange} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: Spacing.three,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: MaxContentWidth,
        padding: Spacing.three,
        borderRadius: Spacing.three,
        gap: Spacing.two,
    },
    link: { color: '#3c87f7' },
    choices: { gap: Spacing.two },
    choice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    choiceText: { flex: 1 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: Spacing.two },
});
