import type { Post, UserLocation } from '@growme/shared';
import { router, useFocusEffect } from 'expo-router';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { meApi } from '@/api/me';
import { useTopClearance } from '@/components/layout/app-shell';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Section } from '@/components/ui/section';
import { card } from '@/components/ui/styles';
import { TextField } from '@/components/ui/text-field';
import { authClient } from '@/lib/auth-client';
import { openCookieSettings } from '@/lib/consent';
import { timeAgo } from '@/lib/format';
import { approximateLocation, coordinatesLabel, type LocationError } from '@/lib/location';
import { usePagedList } from '@/lib/use-api';
import { colors, iconSize, size, space } from '@/theme';

const MAX_NAME = 60;
const AVATAR = size.touch * 1.5;

type Row = { icon: IconName; label: string; onPress: () => void; color?: string };

/** The account rows that used to be the Settings page */
const ROWS: Row[] = [
  { icon: 'notes', label: 'Οι σημειώσεις μου', onPress: () => router.navigate('/notes') },
  { icon: 'privacy', label: 'Απόρρητο', onPress: () => router.navigate('/privacy') },
  // Cookies exist only on the web
  ...(Platform.OS === 'web'
    ? [{ icon: 'cookie' as const, label: 'Ρυθμίσεις cookies', onPress: openCookieSettings }]
    : []),
  { icon: 'signOut', label: 'Αποσύνδεση', onPress: () => authClient.signOut(), color: colors.accent },
];

/** Name with «Επεξεργασία»: the field opens in place; saved through Better Auth */
function NameEditor({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = draft.trim();
    if (!next) return setError('Γράψε ένα όνομα.');
    if (next.length > MAX_NAME) return setError(`Έως ${MAX_NAME} χαρακτήρες.`);
    setSaving(true);
    setError(null);
    const { error: failed } = await authClient.updateUser({ name: next });
    setSaving(false);
    if (failed) return setError('Το όνομα δεν αποθηκεύτηκε. Δοκίμασε ξανά.');
    setEditing(false);
  };

  if (!editing) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Επεξεργασία ονόματος"
        onPress={() => {
          setDraft(name);
          setEditing(true);
        }}
        style={styles.row}>
        <Icon name="edit" size={iconSize.normal} color={colors.primary} />
        <View style={styles.label}>
          <AppText size="small" color={colors.inkMuted}>
            Όνομα
          </AppText>
          <AppText>{name}</AppText>
        </View>
        <AppText size="small" bold color={colors.primary}>
          Επεξεργασία
        </AppText>
      </PressableScale>
    );
  }
  return (
    <View style={styles.editor}>
      <TextField
        label="Όνομα (φαίνεται στις αναρτήσεις σου)"
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          setError(null);
        }}
        maxLength={MAX_NAME}
        autoFocus
        autoComplete="name"
        onSubmitEditing={save}
        error={error}
      />
      <View style={styles.actions}>
        <PillButton label="Άκυρο" onPress={() => setEditing(false)} />
        <ActionButton size="md" edge={false} glow="soft" onPress={save}>
          <ActionButtonText>{saving ? 'Αποθήκευση…' : 'Αποθήκευση'}</ActionButtonText>
        </ActionButton>
      </View>
    </View>
  );
}

const LOCATION_ERRORS: Record<LocationError | 'failed', string> = {
  denied: 'Δεν δόθηκε άδεια για την τοποθεσία. Μπορείς να τη δώσεις από τις ρυθμίσεις της συσκευής.',
  unavailable: 'Η τοποθεσία δεν βρέθηκε. Δοκίμασε ξανά σε λίγο.',
  failed: 'Η περιοχή δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
};

/** «Η περιοχή μου»: the phone's approximate position (about 1 km), for advice by climate */
function MyArea() {
  const [location, setLocation] = useState<UserLocation | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    meApi
      .location()
      .then(setLocation)
      .catch(() => setLocation(null));
  }, []);

  const useDevice = async () => {
    setBusy(true);
    setError(null);
    try {
      const found = await approximateLocation();
      setLocation(await meApi.setLocation(found));
    } catch (err) {
      const reason = err instanceof Error && (err.message === 'denied' || err.message === 'unavailable') ? err.message : 'failed';
      setError(LOCATION_ERRORS[reason]);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await meApi.removeLocation();
      setLocation(null);
    } catch {
      setError(LOCATION_ERRORS.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.area}>
      <View style={styles.areaRow}>
        <Icon name="location" size={iconSize.normal} color={colors.primary} />
        <View style={styles.label}>
          <AppText size="small" color={colors.inkMuted}>
            Η περιοχή μου
          </AppText>
          {location === undefined ? (
            <ActivityIndicator color={colors.primary} style={styles.left} />
          ) : (
            <AppText>
              {location ? (location.area ?? `Κοντά σε ${coordinatesLabel(location.lat, location.lng)}`) : 'Δεν έχει οριστεί'}
            </AppText>
          )}
        </View>
      </View>
      <AppText size="small" color={colors.inkMuted}>
        Μόνο η περιοχή (περίπου 1 χλμ.), ποτέ η διεύθυνσή σου. Θα τη χρησιμοποιούμε για συμβουλές ανάλογα με το κλίμα.
      </AppText>
      <View style={styles.actions}>
        {location && <PillButton label="Αφαίρεση" onPress={remove} />}
        <ActionButton size="md" edge={false} glow="soft" onPress={busy ? undefined : useDevice}>
          <ActionButtonText>{busy ? 'Αναζήτηση…' : location ? 'Ενημέρωση' : 'Χρήση τοποθεσίας'}</ActionButtonText>
        </ActionButton>
      </View>
      {error && (
        <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      )}
    </View>
  );
}

/** A liked post: title, author and when; opens the post */
function LikedPost({ post }: { post: Post }) {
  return (
    <PressableScale
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/community/[id]', params: { id: String(post.id) } })}
      style={styles.row}>
      <Icon name="heart" size={iconSize.normal} color={colors.primary} />
      <View style={styles.label}>
        <AppText bold numberOfLines={2}>
          {post.title}
        </AppText>
        <AppText size="small" color={colors.inkMuted}>
          {post.author.name} · {timeAgo(post.createdAt)} · 👍 {post.likeCount}
        </AppText>
      </View>
      <Icon name="chevronRight" size={iconSize.small} color={colors.inkMuted} />
    </PressableScale>
  );
}

/** The profile: name, password, area, the posts I liked, and the account rows */
export default function ProfileScreen() {
  const topClearance = useTopClearance();
  const { data: session } = authClient.useSession();
  // Google-only accounts have no password to change
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const liked = usePagedList(meApi.likedPosts);
  const { refresh } = liked;
  const focusedBefore = useRef(false);

  useEffect(() => {
    authClient
      .listAccounts()
      .then(({ data }) => setHasPassword(!!data?.some((a) => a.providerId === 'credential')))
      .catch(() => setHasPassword(true));
  }, []);

  // Likes change on other pages: reload when coming back (the first page loads by itself)
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) refresh();
      focusedBefore.current = true;
    }, [refresh]),
  );

  const user = session?.user;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.page, { paddingTop: topClearance }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText size="big" bold color={colors.primary}>
            {(user?.name ?? '?').charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.label}>
          <AppText size="big" bold color={colors.primary} accessibilityRole="header">
            {user?.name ?? 'Προφίλ'}
          </AppText>
          {user && (
            <AppText size="small" color={colors.inkMuted}>
              {user.email}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.card}>
        {user && <NameEditor name={user.name} />}
        <View style={styles.divider} />
        {hasPassword === false ? (
          <View style={styles.row}>
            <Icon name="key" size={iconSize.normal} color={colors.inkMuted} />
            <AppText size="small" color={colors.inkMuted} style={styles.label}>
              Συνδέεσαι με Google: ο κωδικός σου αλλάζει στον λογαριασμό Google.
            </AppText>
          </View>
        ) : (
          <PressableScale accessibilityRole="button" onPress={() => router.push('/profile/password')} style={styles.row}>
            <Icon name="key" size={iconSize.normal} color={colors.primary} />
            <AppText style={styles.label}>Αλλαγή κωδικού</AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.inkMuted} />
          </PressableScale>
        )}
      </View>

      <View style={styles.card}>
        <MyArea />
      </View>

      <Section title="Αναρτήσεις που μου άρεσαν">
        <View style={styles.card}>
          {liked.items.map((post, index) => (
            <Fragment key={post.id}>
              {index > 0 && <View style={styles.divider} />}
              <LikedPost post={post} />
            </Fragment>
          ))}
          {!liked.loading && !liked.error && liked.items.length === 0 && (
            <AppText color={colors.inkMuted} style={styles.empty}>
              Δεν σου έχει αρέσει καμία ανάρτηση ακόμα.
            </AppText>
          )}
          {liked.loading && <ActivityIndicator color={colors.primary} style={styles.empty} />}
          {liked.error && !liked.loading && (
            <View style={styles.empty}>
              <AppText size="small" color={colors.inkMuted}>
                Δεν ήταν δυνατή η φόρτωση.
              </AppText>
              <PillButton label="Δοκίμασε ξανά" onPress={liked.items.length ? liked.loadMore : liked.refresh} />
            </View>
          )}
          {liked.hasMore && !liked.loading && !liked.error && (
            <View style={styles.empty}>
              <PillButton label="Περισσότερες" onPress={liked.loadMore} />
            </View>
          )}
        </View>
      </Section>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xs,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
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
  editor: {
    gap: space.sm,
    padding: space.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
  area: {
    gap: space.sm,
    padding: space.md,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  left: {
    alignSelf: 'flex-start',
  },
  empty: {
    alignItems: 'flex-start',
    gap: space.xs,
    padding: space.md,
  },
});
