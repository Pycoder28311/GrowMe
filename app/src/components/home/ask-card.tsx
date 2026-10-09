import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { uploadImages } from '@/api/images';
import { postsApi } from '@/api/posts';
import { PaperPlane, type PaperPlaneHandle } from '@/components/home/paper-plane';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { firstSentence } from '@/lib/posts';
import { alpha, colors, fontFamily, fontSize, formGray, iconSize, quietGray, radius, shadow, size, space } from '@/theme';

const MAX_PHOTOS = 4;
const THUMB = size.touch * 1.25;

type Sent = { id: number } | null;

const QUESTION = 'Η ερώτησή σου...';
const NEXT_QUESTION = 'Επόμενη ερώτηση...';
/** A piece's trip into the plane, and the gap between pieces */
const INTO_PLANE_MS = 520;
const PIECE_STAGGER_MS = 60;

type Box = { left: number; top: number; width: number; height: number };
/** A copy of what was sent (the text, or one photo) flying into the plane, in the card's coordinates */
type Piece = { key: string; box: Box; text?: string; uri?: string };

const measure = (view: View | null) =>
  new Promise<Box | null>((resolve) =>
    view ? view.measureInWindow((left, top, width, height) => resolve({ left, top, width, height })) : resolve(null),
  );

/** One sent piece on a plain white card: shrinks into the plane and fades as it arrives */
function FlyingPiece({ piece, target, delay, onDone }: { piece: Piece; target: { x: number; y: number }; delay: number; onDone?: () => void }) {
  const progress = useSharedValue(0);
  const { box } = piece;

  useEffect(() => {
    progress.set(
      withDelay(delay, withTiming(1, { duration: INTO_PLANE_MS, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished && onDone) scheduleOnRN(onDone);
      })),
    );
  }, [delay, onDone, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 0.75, 1], [1, 1, 0]),
      transform: [
        { translateX: (target.x - (box.left + box.width / 2)) * p },
        { translateY: (target.y - (box.top + box.height / 2)) * p },
        { scale: 1 - 0.92 * p },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.piece, box, style]}>
      {piece.uri ? (
        <Image source={{ uri: piece.uri }} contentFit="cover" style={styles.pieceImage} />
      ) : (
        <AppText numberOfLines={Math.max(1, Math.floor((box.height - 2 * space.sm) / 22))}>{piece.text}</AppText>
      )}
    </Animated.View>
  );
}

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
  const [placeholder, setPlaceholder] = useState(QUESTION);
  const [focus, setFocus] = useState<'title' | 'question' | null>(null);
  // The copies flying into the plane after a send, and where the plane is
  const [flying, setFlying] = useState<{ pieces: Piece[]; target: { x: number; y: number } } | null>(null);
  const reduced = useReducedMotion();
  const cardRef = useRef<View>(null);
  const questionRef = useRef<View>(null);
  const thumbRefs = useRef<(View | null)[]>([]);
  const planeSpotRef = useRef<View>(null);
  const plane = useRef<PaperPlaneHandle>(null);

  /** What was just sent flies into the plane, then the plane flies off and a new one comes */
  const flyAway = async (text: string, uris: string[]) => {
    const [cardBox, questionBox, planeBox, ...thumbBoxes] = await Promise.all([
      measure(cardRef.current),
      measure(questionRef.current),
      measure(planeSpotRef.current),
      ...uris.map((_, i) => measure(thumbRefs.current[i])),
    ]);
    if (!cardBox || !questionBox || !planeBox) return;
    const local = (b: Box): Box => ({ ...b, left: b.left - cardBox.left, top: b.top - cardBox.top });
    const pieces: Piece[] = [
      { key: 'text', box: local(questionBox), text },
      ...uris.flatMap((uri, i) => (thumbBoxes[i] ? [{ key: `photo-${i}`, box: local(thumbBoxes[i]!), uri }] : [])),
    ];
    const target = { x: planeBox.left - cardBox.left + planeBox.width / 2, y: planeBox.top - cardBox.top + planeBox.height / 2 };
    setFlying({ pieces, target });
  };

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
      // Copies of the text and photos take their place and fly into the plane; the fields empty under them
      if (!reduced) await flyAway(content, photos.map((photo) => photo.uri));
      setTitle('');
      setQuestion('');
      setPhotos([]);
      setShowTitle(false);
      setPlaceholder(NEXT_QUESTION);
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

      <View ref={cardRef} collapsable={false} style={styles.card}>
        {showTitle && (
          <Animated.View entering={FadeIn.duration(200)}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocus('title')}
              onBlur={() => setFocus(null)}
              placeholder="Τίτλος (προαιρετικός)"
              placeholderTextColor={colors.inkMuted}
              accessibilityLabel="Τίτλος (προαιρετικός)"
              maxLength={200}
              style={[styles.input, styles.titleInput, focus === 'title' && styles.focused]}
            />
            {/* A clear line between the title and the question */}
            <View style={styles.divider} />
          </Animated.View>
        )}
        <View ref={questionRef} collapsable={false}>
          <TextInput
            value={question}
            onChangeText={(text) => {
              setQuestion(text);
              setSent(null);
              setError(null);
            }}
            onFocus={() => {
              setShowTitle(true);
              setFocus('question');
            }}
            onBlur={() => setFocus(null)}
            placeholder={placeholder}
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel="Η ερώτησή σου"
            multiline
            maxLength={10000}
            textAlignVertical="top"
            style={[styles.input, styles.question, focus === 'question' && styles.focused]}
          />
        </View>

        {photos.length > 0 && (
          <View style={styles.photos}>
            {photos.map((photo, index) => (
              <View
                key={photo.uri}
                ref={(view) => {
                  thumbRefs.current[index] = view;
                }}
                collapsable={false}>
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
            <Pressable
              accessibilityRole="button"
              onPress={pickPhotos}
              style={({ pressed }) => [styles.addPhoto, pressed && styles.addPhotoPressed]}>
              <Icon name="photo" size={iconSize.big} color={formGray} />
              <AppText bold color={formGray}>
                Φωτογραφία
              </AppText>
            </Pressable>
          ) : (
            <AppText size="small" color={colors.inkMuted}>
              Έως {MAX_PHOTOS} φωτογραφίες
            </AppText>
          )}
          <View ref={planeSpotRef} collapsable={false}>
            <PaperPlane ref={plane} onPress={send} busy={sending} />
          </View>
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

        {/* What was sent, flying into the plane (over the emptied form) */}
        {flying &&
          flying.pieces.map((piece, i) => (
            <FlyingPiece
              key={piece.key}
              piece={piece}
              target={flying.target}
              delay={i * PIECE_STAGGER_MS}
              onDone={
                i === flying.pieces.length - 1
                  ? () => {
                      plane.current?.fly();
                      setFlying(null);
                    }
                  : undefined
              }
            />
          ))}
      </View>

      {/* As wide as the form, with the same corners */}
      <PressableScale
        accessibilityRole="link"
        onPress={() => router.navigate('/community')}
        pressedScale={0.98}
        style={styles.seeAll}>
        <AppText bold color={colors.primary}>
          Δες όλες τις αναρτήσεις
        </AppText>
        <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
      </PressableScale>
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
    borderRadius: radius.xs,
  },
  // A gray border appears on focus (no browser outline); roomy inside
  input: {
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.xs,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  focused: {
    borderColor: alpha(formGray, 0.5),
  },
  titleInput: {
    fontFamily: fontFamily.bold,
  },
  divider: {
    height: 2,
    marginTop: space.xs,
    marginHorizontal: space.md,
    borderRadius: 1,
    backgroundColor: '#d0d4d9',
  },
  question: {
    minHeight: size.touch * 1.5,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.xs,
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
  // Photo button left, the paper plane right, both centred on one line
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  // Like an email form's attach button: gray, a light background while pressed
  addPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: size.touch,
    paddingHorizontal: space.md,
    borderRadius: radius.xs,
  },
  addPhotoPressed: {
    backgroundColor: quietGray,
  },
  sent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  seeAll: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: size.touch,
    borderRadius: radius.xs,
  },
  // A sent piece on its white card
  piece: {
    position: 'absolute',
    overflow: 'hidden',
    padding: space.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  pieceImage: {
    ...StyleSheet.absoluteFill,
  },
});
