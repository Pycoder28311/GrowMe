import type { Post, PostPlant } from '@growme/shared';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
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
import { MessageInput } from '@/components/ui/message-input';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { firstSentence } from '@/lib/posts';
import { goToSignIn, useSignedInId } from '@/lib/sign-in-gate';
import { alpha, botanical, colors, fontFamily, fontSize, formGray, iconSize, quietGray, radius, shadow, size, space, titleFont } from '@/theme';

const MAX_PHOTOS = 4;
/** The posts page's field, once opened, is this many lines tall at least */
const EXPANDED_LINES = 5;
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
export function AskCard({
  plant,
  composer,
  onPosted,
  cardStyle,
  titleStyle,
  fieldColor,
}: {
  plant?: PostPlant;
  composer?: boolean;
  onPosted?: (post: Post) => void;
  /** A page's own look for the card (e.g. the plant page's cream) */
  cardStyle?: StyleProp<ViewStyle>;
  /** A page's own look for the heading (e.g. the plant page's left-aligned section title) */
  titleStyle?: StyleProp<TextStyle>;
  /** The posts page's bar: the colour of its fields, instead of white */
  fieldColor?: string;
}) {
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

  // The pieces the form (and the posts page's bar) are made of
  const photosRow =
    photos.length > 0 ? (
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
              <Icon name="close" size={iconSize.small} color={colors.white} bold />
            </PressableScale>
          </View>
        ))}
      </View>
    ) : null;
  // Elsewhere than a plant's page: the plant the question is about (optional), picked in the panel from below.
  // It is a button like the photo one, above it, with the same link icon the plant page's note has
  const linkRow = showLink ? (
    linked ? (
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
    )
  ) : null;
  const photoButton =
    photos.length < MAX_PHOTOS ? (
      <Pressable accessibilityRole="button" onPress={pickPhotos} style={({ pressed }) => [styles.addPhoto, pressed && styles.addPhotoPressed]}>
        <Icon name="photo" size={iconSize.big} color={formGray} />
        <AppText bold color={formGray}>
          Φωτογραφία
        </AppText>
      </Pressable>
    ) : (
      <AppText size="small" color={colors.inkMuted}>
        Έως {MAX_PHOTOS} φωτογραφίες
      </AppText>
    );
  const errorNote = error ? (
    <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
      {error}
    </AppText>
  ) : null;
  // What was sent, flying into the plane (over the emptied form)
  const flyingPieces =
    flying &&
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
    ));
  const picker = picking && (
    <PlantPicker
      onPick={setLinked}
      onClose={() => {
        setPicking(false);
        // Back in the question: tapping elsewhere then leaves it, which closes the form again
        // (after the panel has gone: its window still holds the focus until then)
        setTimeout(() => questionInput.current?.focus(), 100);
      }}
    />
  );

  // The posts page's bar: the app's one message field, with the title above the text and the photo and plant
  // buttons under it once it is open
  if (composer) {
    return (
      <View style={styles.root}>
        {/* A press anywhere in the form keeps the title field open */}
        <View
          collapsable={false}
          onStartShouldSetResponderCapture={() => {
            pressedInCard.current = true;
            return false;
          }}>
          <View ref={cardRef} collapsable={false}>
            <MessageInput
              placeholder={placeholder}
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                setError(null);
              }}
              onSend={() => send()}
              fieldColor={fieldColor}
              // Tapped into: the field widens to the whole screen (taking back the bar's side padding), loses its rounded
              // corners and gets taller
              minLines={showTitle ? EXPANDED_LINES : 1}
              style={[styles.floating, showTitle && styles.expanded]}
              maxLength={10000}
              sendButton={planeButton}
              textAreaRef={questionRef}
              inputRef={questionInput}
              onFocus={() => {
                pressedInCard.current = false;
                setShowTitle(true);
                setFocus('question');
              }}
              onBlur={() => setFocus(null)}
              above={
                showTitle ? (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <View style={styles.titleRow}>
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
                        style={[styles.input, styles.titleInput, styles.composerTitle]}
                      />
                      {/* A quiet × that closes the open field again (the text stays) */}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Κλείσιμο"
                        hitSlop={space.sm}
                        onPress={() => {
                          Keyboard.dismiss();
                          setTitle('');
                          setShowTitle(false);
                        }}
                        style={styles.closeForm}>
                        <Icon name="close" size={iconSize.normal} color={colors.inkMuted} />
                      </Pressable>
                    </View>
                    <View style={styles.divider} />
                  </Animated.View>
                ) : null
              }
              below={
                showTitle ? (
                  <>
                    {photosRow}
                    {linkRow}
                    <View style={styles.footer}>{photoButton}</View>
                    {errorNote}
                  </>
                ) : (
                  errorNote
                )
              }
            />
            {flyingPieces}
          </View>
        </View>
        {picker}
      </View>
    );
  }

  // The home page's card: the heading, the form, and «see all»
  return (
    <View style={styles.root}>
      <AppText size="big" bold accessibilityRole="header" style={[styles.title, titleFont, titleStyle]}>
        Ρώτησέ μας ό,τι θες!
      </AppText>

      {/* The form and its plant button: a press on either keeps the title field open */}
      <View
        collapsable={false}
        onStartShouldSetResponderCapture={() => {
          pressedInCard.current = true;
          return false;
        }}
        style={styles.form}>
        <View ref={cardRef} collapsable={false} style={[styles.card, cardStyle]}>
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
                style={[styles.input, styles.titleInput, focus === 'title' && styles.focused]}
              />
              {/* A clear line between the title and the question */}
              <View style={styles.divider} />
            </Animated.View>
          )}
          <View ref={questionRef} collapsable={false}>
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
              accessibilityLabel="Η ερώτησή σου"
              multiline
              maxLength={10000}
              textAlignVertical="top"
              style={[
                styles.input,
                styles.question,
                // Before the first tap (no title above): the placeholder sits a little lower
                !showTitle && styles.questionAlone,
                focus === 'question' && styles.focused,
              ]}
            />
          </View>

          {photosRow}

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

          {linkRow}

          <View style={styles.footer}>
            {photoButton}
            {planeButton}
          </View>

          {errorNote}
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

          {flyingPieces}
        </View>
      </View>

      {/* As wide as the form, with the same corners */}
      <PressableScale accessibilityRole="link" onPress={() => router.navigate('/community')} pressedScale={0.98} style={styles.seeAll}>
        <AppText bold color={colors.primary}>
          Δες όλες τις αναρτήσεις
        </AppText>
        <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
      </PressableScale>

      {picker}
    </View>
  );
}

const styles = StyleSheet.create({
  // The posts bar's title: as tall as the send button, its text starting where the question's does
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  composerTitle: {
    flex: 1,
    minHeight: size.touch,
    paddingHorizontal: 0,
    paddingVertical: space.sm,
    borderColor: 'transparent',
  },
  closeForm: {
    opacity: 0.7,
    padding: space.xs,
  },
  // The posts page's floating bar: a soft shadow all around it
  floating: {
    boxShadow: `0 0 16px 2px ${alpha(botanical.ink, 0.2)}`,
  },
  // The open field of the posts page's bar: edge to edge, square corners
  expanded: {
    marginHorizontal: -space.md,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
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
  card: {
    ...card,
    gap: space.sm,
    // Close to the edges: the buttons and the fields sit near the card's border
    padding: space.xs,
    borderRadius: radius.xs,
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
    backgroundColor: botanical.lineSoft,
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
