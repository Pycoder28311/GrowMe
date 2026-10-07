import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { card } from '@/components/ui/styles';
import { TextField } from '@/components/ui/text-field';
import { authClient } from '@/lib/auth-client';
import { colors, space } from '@/theme';

const MIN_PASSWORD = 8; // Better Auth's minimum

/** Change password: the current one, the new one twice; other devices are signed out */
export default function ChangePasswordScreen() {
  const topClearance = useTopClearance();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; repeat?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    const found: typeof errors = {};
    if (!current) found.current = 'Γράψε τον τωρινό κωδικό.';
    if (next.length < MIN_PASSWORD) found.next = `Τουλάχιστον ${MIN_PASSWORD} χαρακτήρες.`;
    else if (next === current) found.next = 'Διάλεξε διαφορετικό κωδικό από τον τωρινό.';
    if (repeat !== next) found.repeat = 'Οι δύο κωδικοί δεν είναι ίδιοι.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setSaving(false);
    if (error) {
      setErrors(
        error.code === 'INVALID_PASSWORD'
          ? { current: 'Ο τωρινός κωδικός δεν είναι σωστός.' }
          : error.code === 'PASSWORD_TOO_SHORT' || error.code === 'PASSWORD_TOO_LONG'
            ? { next: 'Ο νέος κωδικός δεν γίνεται δεκτός (8–128 χαρακτήρες).' }
            : { form: 'Ο κωδικός δεν άλλαξε. Δοκίμασε ξανά.' },
      );
      return;
    }
    setDone(true);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.page, { paddingTop: topClearance }]}>
      <AppText size="big" bold color={colors.primary} accessibilityRole="header">
        Αλλαγή κωδικού
      </AppText>
      {done ? (
        <View style={styles.card}>
          <AppText accessibilityLiveRegion="polite">
            Ο κωδικός άλλαξε. Οι άλλες συσκευές σου αποσυνδέθηκαν.
          </AppText>
          <View style={styles.actions}>
            <ActionButton size="md" edge={false} glow="soft" onPress={() => router.back()}>
              <ActionButtonText>Πίσω στο προφίλ</ActionButtonText>
            </ActionButton>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <TextField
            label="Τωρινός κωδικός"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoComplete="current-password"
            error={errors.current}
          />
          <TextField
            label={`Νέος κωδικός (τουλάχιστον ${MIN_PASSWORD} χαρακτήρες)`}
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoComplete="new-password"
            error={errors.next}
          />
          <TextField
            label="Ξανά ο νέος κωδικός"
            value={repeat}
            onChangeText={setRepeat}
            secureTextEntry
            autoComplete="new-password"
            onSubmitEditing={save}
            error={errors.repeat}
          />
          {errors.form && (
            <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
              {errors.form}
            </AppText>
          )}
          <View style={styles.actions}>
            <PillButton label="Άκυρο" onPress={() => router.back()} />
            <ActionButton size="md" edge={false} glow="soft" onPress={saving ? undefined : save}>
              <ActionButtonText>{saving ? 'Αποθήκευση…' : 'Αλλαγή κωδικού'}</ActionButtonText>
            </ActionButton>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  card: {
    ...card,
    gap: space.md,
    padding: space.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
});
