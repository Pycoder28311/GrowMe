import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { uploadImages } from '@/api/images';
import { postsApi } from '@/api/posts';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { firstSentence } from '@/lib/posts';
import { colors, fontFamily, fontSize, iconSize, radius, size, space } from '@/theme';

const MAX_PHOTOS = 4;
const THUMB = size.touch * 1.25;

type Sent = { id: number } | null;

/**
 * "Ask us anything": the question becomes a community post (Messages tab). Tapping into the question
 * shows an optional title above it (empty = the question's first sentence); up to 4 photos.
 */
export function AskCard() {
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent>(null);
  const [error, setError] = useState<string | null>(null);

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: MAX_PHOTOS - photos.length > 1,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos((current) => [...current, ...result.assets].slice(0, MAX_PHOTOS));
  };

  const send = async () => {
    const content = question.trim();
    if (sending) return;
    if (!content) {
      setError('Γράψε πρώτα την ερώτησή σου.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const uploaded = photos.length ? await uploadImages(photos) : [];
      const post = await postsApi.create({
        title: title.trim() || firstSentence(content),
        content,
        imageIds: uploaded.map((image) => image.id),
      });
      setTitle('');
      setQuestion('');
      setPhotos([]);
      setShowTitle(false);
      setSent({ id: post.id });
    } catch {
      setError('Η ερώτηση δεν στάλθηκε. Δοκίμασε ξανά.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppText size="big" bold accessibilityRole="header" style={styles.title}>
        Ρώτησέ μας ό,τι θες!
      </AppText>

      <View style={styles.card}>
        {showTitle && (
          <Animated.View entering={FadeIn.duration(200)}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Τίτλος (προαιρετικός)"
              placeholderTextColor={colors.inkMuted}
              accessibilityLabel="Τίτλος (προαιρετικός)"
              maxLength={200}
              style={[styles.input, styles.titleInput]}
            />
          </Animated.View>
        )}
        <TextInput
          value={question}
          onChangeText={(text) => {
            setQuestion(text);
            setSent(null);
            setError(null);
          }}
          onFocus={() => setShowTitle(true)}
          placeholder="Η ερώτησή σου..."
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Η ερώτησή σου"
          multiline
          maxLength={10000}
          textAlignVertical="top"
          style={[styles.input, styles.question]}
        />

        {photos.length > 0 && (
          <View style={styles.photos}>
            {photos.map((photo, index) => (
              <View key={photo.uri}>
                <Image source={{ uri: photo.uri }} contentFit="cover" style={styles.thumb} />
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Αφαίρεση φωτογραφίας ${index + 1}`}
                  onPress={() => setPhotos((current) => current.filter((p) => p !== photo))}
                  style={styles.remove}>
                  <Icon name="close" size={iconSize.small} color={colors.surface} bold />
                </PressableScale>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {photos.length < MAX_PHOTOS ? (
            <PressableScale accessibilityRole="button" onPress={pickPhotos} style={styles.addPhoto}>
              <Icon name="photo" size={iconSize.normal} color={colors.primary} />
              <AppText size="small" bold color={colors.primary}>
                Φωτογραφία
              </AppText>
            </PressableScale>
          ) : (
            <AppText size="small" color={colors.inkMuted}>
              Έως {MAX_PHOTOS} φωτογραφίες
            </AppText>
          )}
          <ActionButton size="md" edge={false} glow="soft" onPress={send} style={sending && styles.sending}>
            <ActionButtonText>{sending ? 'Αποστολή…' : 'Αποστολή'}</ActionButtonText>
          </ActionButton>
        </View>

        {error && (
          <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        )}
        {sent && (
          <PressableScale
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: String(sent.id) } })}
            style={styles.sent}>
            <AppText size="small" color={colors.primary} accessibilityLiveRegion="polite">
              Η ερώτησή σου δημοσιεύτηκε.{' '}
              <AppText size="small" bold color={colors.primary}>
                Δες την
              </AppText>
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
          </PressableScale>
        )}
      </View>

      <View style={styles.seeAll}>
        <PillButton label="Δες όλες τις αναρτήσεις" onPress={() => router.navigate('/community')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  title: {
    textAlign: 'center',
    // White glow keeps it readable over the background photo
    textShadowColor: colors.surface,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  card: {
    ...card,
    gap: space.sm,
    padding: space.md,
  },
  input: {
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    padding: 0,
  },
  titleInput: {
    fontFamily: fontFamily.bold,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  question: {
    minHeight: size.touch * 1.5,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  remove: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
    width: iconSize.big,
    height: iconSize.big,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  addPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.xs,
  },
  sending: {
    opacity: 0.6,
  },
  sent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  seeAll: {
    alignItems: 'center',
  },
});
