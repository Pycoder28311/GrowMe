import { router } from 'expo-router';
import { Fragment } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { authClient } from '@/lib/auth-client';
import { openCookieSettings } from '@/lib/consent';
import { colors, iconSize, space } from '@/theme';

type Row = { icon: IconName; label: string; onPress: () => void; color?: string };

const ROWS: Row[] = [
  { icon: 'notes', label: 'Οι σημειώσεις μου', onPress: () => router.navigate('/notes') },
  { icon: 'privacy', label: 'Απόρρητο', onPress: () => router.navigate('/privacy') },
  // Cookies exist only on the web
  ...(Platform.OS === 'web'
    ? [{ icon: 'cookie' as const, label: 'Ρυθμίσεις cookies', onPress: openCookieSettings }]
    : []),
  { icon: 'signOut', label: 'Αποσύνδεση', onPress: () => authClient.signOut(), color: colors.accent },
];

/** The account menu: notes, privacy, cookies and sign out */
export default function SettingsScreen() {
  const topClearance = useTopClearance();
  const { data: session } = authClient.useSession();

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: topClearance }]}>
      <View style={styles.header}>
        <AppText size="big" bold color={colors.primary} accessibilityRole="header">
          Ρυθμίσεις
        </AppText>
        {session && (
          <AppText size="small" color={colors.inkMuted}>
            {session.user.email}
          </AppText>
        )}
      </View>

      <View style={styles.card}>
        {ROWS.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && <View style={styles.divider} />}
            <PressableScale accessibilityRole="button" onPress={row.onPress} pressedScale={0.98} style={styles.row}>
              <Icon name={row.icon} size={iconSize.normal} color={row.color ?? colors.primary} />
              <AppText color={row.color ?? colors.ink} style={styles.label}>
                {row.label}
              </AppText>
              <Icon name="chevronRight" size={iconSize.small} color={colors.inkMuted} />
            </PressableScale>
          </Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  header: {
    gap: space.xs,
    paddingHorizontal: space.xs,
  },
  card: {
    ...card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  label: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: space.md,
    backgroundColor: colors.border,
  },
});
