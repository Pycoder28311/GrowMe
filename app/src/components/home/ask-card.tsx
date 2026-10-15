import type { Post, PostPlant } from '@growme/shared';
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
import { PlantBadge } from '@/components/plants/plant-badge';
import { PlantPicker } from '@/components/plants/plant-picker';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { firstSentence } from '@/lib/posts';
import { goToSignIn, useSignedInId } from '@/lib/sign-in-gate';
import { alpha, colors, fontFamily, fontSize, formGray, iconSize, quietGray, radius, shadow, size, space } from '@/theme';

const MAX_PHOTOS = 4;
/** The plant link row's height (the photo button's is size.touch) */
const LINK_ROW = 34;
const THUMB = size.touch * 1.25;

type Sent = { id: number } | null;

const QUESTION = 'Η ερώτησή σου...';
const NEXT_QUESTION = 'Επόμενη ερώτηση...';
const POST = 'Η ανάρτησή σου...';
const NEXT_POST = 'Επόμενη ανάρτηση...';
/** A piece's trip into the plane, and the gap between pieces */
const INTO_PLANE_MS = 520;
const PIECE_STAGGER_MS = 60;

type Box = { left: number; top: number; width: number; height: number };
/** A copy of what was sent (the text, or one photo) flying into the plane, in the card's coordinates */
type Piece = { key: string; box: Box; text?: string; uri?: string };

/** After React has drawn the latest state (two frames: the commit, then the layout) */
const nextLayout = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

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
 * `plant` (a plant's page): the post is about that plant, said in a line. Otherwise «Σύνδεση με φυτό»
 * picks one (optional) in the panel from below.
 * `composer` (the posts page's bottom bar): no heading or «see all»; before a tap it is only the
 * question field with the plane beside it, and the title, photo and plant buttons appear on the tap
 * (and go again when the user taps elsewhere). `onPosted` gets the new post.
 */
export function AskCard({ plant, composer, onPosted }: { plant?: PostPlant; composer?: boolean; onPosted?: (post: Post) => void }) {
  const [showTitle, setShowTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(composer ? POST : QUESTION);
  const [focus, setFocus] = useState<'title' | 'question' | null>(null);
  const [linked, setLinked] = useState<PostPlant | null>(null);
  const [picking, setPicking] = useState(false);
  // The copies flying into the plane after a send, and where the plane is
  const [flying, setFlying] = useState<{ pieces: Piece[]; target: { x: number; y: number } } | null>(null);
  const reduced = useReducedMotion();
  const signedIn = useSignedInId() !== null;
  const cardRef = useRef<View>(null);
  // A press that started inside the card (its buttons): leaving an input for them keeps the title field
  const pressedInCard = useRef(false);
  const questionRef = useRef<View>(null);
  const questionInput = useRef<TextInput>(null);
  const thumbRefs = useRef<(View | null)[]>([]);
  const planeSpotRef = useRef<View>(null);
  const plane = useRef<PaperPlaneHandle>(null);
  // The composer before a tap: just the question and the plane in one row
  const compact = !!composer && !showTitle;
  // The posts page's bar: no white card, the fields (black border) and buttons float on the page
  const floating = !!composer;

  // Focus gone from both inputs, to somewhere outside the card, with no title written: the title field
  // goes away again, like before the first tap. (A short wait: moving between the inputs is a blur, then a focus.)
  useEffect(() => {
    if (!showTitle || focus !== null) return;
    const timer = setTimeout(() => {
      if (!pressedInCard.current && !title.trim()) setShowTitle(false);
      pressedInCard.current = false;
    }, 150);
    return () => clearTimeout(timer);
  }, [showTitle, focus, title]);

  /**
   * What was just sent flies into the plane, then the plane flies off and a new one comes. The pieces
   * start where the text and photos are now; `clear` then empties the form, which moves the plane up
   * (the fields shrink), so the plane is measured only after that new layout, to aim at it exactly.
   */
  const flyAway = async (text: string, uris: string[], clear: () => void) => {
    const [cardBox, questionBox, ...thumbBoxes] = await Promise.all([
      measure(cardRef.current),
      measure(questionRef.current),
      ...uris.map((_, i) => measure(thumbRefs.current[i])),
    ]);
    clear();
    if (!cardBox || !questionBox) return;
    await nextLayout();
    const [cardNow, planeBox] = await Promise.all([measure(cardRef.current), measure(planeSpotRef.current)]);
    if (!cardNow || !planeBox) return;
    const local = (b: Box): Box => ({ ...b, left: b.left - cardBox.left, top: b.top - cardBox.top });
    const pieces: Piece[] = [
      { key: 'text', box: local(questionBox), text },
      ...uris.flatMap((uri, i) => (thumbBoxes[i] ? [{ key: `photo-${i}`, box: local(thumbBoxes[i]!), uri }] : [])),
    ];
    // The pieces live inside the card, so the plane's centre in the card as it is now
    const target = { x: planeBox.left - cardNow.left + planeBox.width / 2, y: planeBox.top - cardNow.top + planeBox.height / 2 };
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
    // Signed out: the sign-in page first
    if (!signedIn) {
      goToSignIn();
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
        plantId: plant?.id ?? linked?.id ?? null,
      });
      // Copies of the text and photos take their place and fly into the plane; the fields empty under them
      const clear = () => {
        setTitle('');
        setQuestion('');
        setPhotos([]);
        setLinked(null);
        setShowTitle(false);
        setPlaceholder(composer ? NEXT_POST : NEXT_QUESTION);
        if (!composer) setSent({ id: post.id });
        onPosted?.(post);
      };
      if (reduced) clear();
      else await flyAway(content, photos.map((photo) => photo.uri), clear);
    } catch {
      setError('Η ερώτηση δεν στάλθηκε. Δοκίμασε ξανά.');
    } finally {
      setSending(false);
    }
  };

  const planeButton = (
    <View ref={planeSpotRef} collapsable={false}>
      <PaperPlane ref={plane} onPress={send} busy={sending} />
    </View>
  );
  const showLink = !plant && (!composer || showTitle || !!linked);

  return (
    <View style={styles.root}>
      {!composer && (
        <AppText size="big" bold accessibilityRole="header" style={styles.title}>
          Ρώτησέ μας ό,τι θες!
        </AppText>
      )}

      {/* The form and its plant button: a press on either keeps the title field open */}
      <View
        collapsable={false}
        onStartShouldSetResponderCapture={() => {
          pressedInCard.current = true;
          return false;
        }}
        style={styles.form}>

      <View ref={cardRef} collapsable={false} style={[floating ? styles.floatingCard : styles.card, compact && floating && styles.compactCard, compact && !floating && styles.compactCard]}>
        {showTitle && (
          <Animated.View entering={FadeIn.duration(200)}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              onFocus={() => {
                pressedInCard.current = false;
                setFocus('title');
              }}
              onBlur={() => setFocus(null)}
              placeholder="Τίτλος (προαιρετικός)"
              placeholderTextColor={colors.inkMuted}
              accessibilityLabel="Τίτλος (προαιρετικός)"
              maxLength={200}
              style={[styles.input, styles.titleInput, focus === 'title' && styles.focused, floating && styles.blackBorder]}
            />
            {/* A clear line between the title and the question */}
            {!floating && <View style={styles.divider} />}
          </Animated.View>
        )}
        <View ref={questionRef} collapsable={false} style={compact && styles.compactQuestion}>
          <TextInput
            ref={questionInput}
            value={question}
            onChangeText={(text) => {
              setQuestion(text);
              setSent(null);
              setError(null);
            }}
            onFocus={() => {
              pressedInCard.current = false;
              setShowTitle(true);
              setFocus('question');
            }}
            onBlur={() => setFocus(null)}
            placeholder={placeholder}
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel={composer ? POST : "Η ερώτησή σου"}
            multiline
            maxLength={10000}
            textAlignVertical="top"
            style={[
              styles.input,
              compact ? styles.compactInput : styles.question,
              // Before the first tap (no title above): the placeholder sits a little lower
              !compact && !showTitle && styles.questionAlone,
              focus === 'question' && styles.focused,
              floating && styles.blackBorder,
              compact && floating && styles.compactBare,
            ]}
          />
        </View>

        {compact && planeButton}
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

        {/* A plant page: the post is about this plant */}
        {plant && (
          <View style={styles.plantNote}>
            <Icon name="link" size={iconSize.normal} color={colors.primary} />
            <AppText size="small" color={colors.inkMuted} style={styles.plantNoteText}>
              Η ερώτησή σου θα συνδεθεί με το φυτό{' '}
              <AppText size="small" bold color={colors.primary}>
                {plant.name}
              </AppText>
            </AppText>
          </View>
        )}

        {/* Elsewhere than a plant's page: the plant the question is about (optional), picked in the panel from below.
            It is a button like the photo one, above it, with the same link icon the plant page's note has */}
        {showLink &&
          !compact &&
          (linked ? (
            <View style={styles.linkedPlant}>
              <PlantBadge plant={linked} onRemove={() => setLinked(null)} />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPicking(true)}
              style={({ pressed }) => [styles.addPhoto, styles.linkButton, pressed && styles.addPhotoPressed]}>
              <Icon name="link" size={iconSize.big} color={formGray} />
              <AppText bold color={formGray}>
                Σύνδεση με φυτό
              </AppText>
            </Pressable>
          ))}

        {!compact && (
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
          {planeButton}
        </View>
        )}

        {error && (
          <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        )}
        {sent && !composer && (
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
      </View>

      {/* As wide as the form, with the same corners */}
      {!composer && (
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
      )}

      {picking && (
        <PlantPicker
          onPick={setLinked}
          onClose={() => {
            setPicking(false);
            // Back in the question: tapping elsewhere then leaves it, which closes the form again
            // (after the panel has gone: its window still holds the focus until then)
            setTimeout(() => questionInput.current?.focus(), 100);
          }}
        />
      )}
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
  // The card and the plant button under it
  form: {
    gap: space.sm,
  },
  // The composer before a tap: one field like the article's comment field, the plane inside at its right
  compactCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    padding: space.xs,
    paddingLeft: space.md,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  // The text sits in the field itself: no border of its own
  compactBare: {
    paddingHorizontal: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  // One line as tall as the plane, so the plane is as far from the top and bottom as from the right
  compactInput: {
    height: size.touch,
    lineHeight: 22,
    paddingVertical: (size.touch - 2 - 22) / 2,
  },
  compactQuestion: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    ...card,
    gap: space.sm,
    // Close to the edges: the buttons and the fields sit near the card's border
    padding: space.xs,
    borderRadius: radius.xs,
  },
  // The posts page's form: nothing behind the fields and buttons
  floatingCard: {
    gap: space.sm,
  },
  blackBorder: {
    // The text and placeholder start further in from the border
    paddingHorizontal: space.md,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // A gray border appears on focus (no browser outline); roomy inside
  input: {
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
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
    marginHorizontal: space.sm,
    borderRadius: 1,
    backgroundColor: '#d0d4d9',
  },
  question: {
    minHeight: size.touch * 1.5,
  },
  questionAlone: {
    paddingTop: space.sm + space.xs,
  },
  photos: {
    flexBasis: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.sm,
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
  // The note on a plant's page, above the buttons
  plantNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    marginBottom: -space.sm,
  },
  plantNoteText: {
    flex: 1,
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
    paddingHorizontal: space.sm,
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
  // Like the photo button but shorter: less room above and below it
  linkButton: {
    height: LINK_ROW,
    // Closer to the photo button under it
    marginBottom: -space.sm,
  },
  // The chosen plant, where the link button was
  linkedPlant: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: LINK_ROW,
    paddingHorizontal: space.sm,
    marginBottom: -space.sm,
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
