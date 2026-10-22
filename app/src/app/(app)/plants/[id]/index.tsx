import { lifespanLabel, parseRichContent } from '@growme/shared';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTopClearance } from '@/components/layout/app-shell';
import { AskCard } from '@/components/home/ask-card';
import { usePageHeader } from '@/components/layout/page-header';
import { LightUpText } from '@/components/motion/light-up-text';
import { DESCRIPTION_BUTTON_HEIGHT, DescriptionButton } from '@/components/plants/description-button';
import { ChipRow } from '@/components/plants/chip-row';
import { DateRows } from '@/components/plants/date-rows';
import { InfoRows } from '@/components/plants/info-rows';
import { LifecycleCard } from '@/components/plants/lifecycle/lifecycle-card';
import { PHOTO_GONE_AT, PHOTO_HEIGHT, PHOTO_RISE, PhotoHeader } from '@/components/plants/photo-header';
import { PhotoLightbox, type LightboxPhoto } from '@/components/plants/photo-lightbox';
import { PlantSkeleton } from '@/components/search/page-skeleton';
import { BotanicalBackground, EdgeDrift } from '@/components/layout/botanical-background';
import { PhotoStack } from '@/components/plants/photo-stack';
import { PlantCarousel } from '@/components/plants/plant-carousel';
import { NoteSection } from '@/components/plants/note-section';
import { PlantTiles } from '@/components/plants/plant-tiles';
import { SectionBar, type PageSection } from '@/components/plants/section-bar';
import { TopBlur } from '@/components/plants/top-blur';
import { WatchOutSection } from '@/components/plants/watch-out-section';
import { AppText } from '@/components/ui/app-text';
import { FlowerShape, PaperGrain } from '@/components/ui/flower-shapes';
import { PillButton } from '@/components/ui/pill-button';
import { Section } from '@/components/ui/section';
import { NOTES, restrictionRows, type PlantPageData } from '@/config/plant-page';
import { usePageSections } from '@/lib/page-sections';
import { useCombinationPlants, usePlant } from '@/lib/plants';
import { previewOf } from '@/lib/result-preview';
import { botanical, colors, radius, sectionTitle, serif, size, space, tileGrain, tileShadowStyle, tileTone, TITLE_FLOWER } from '@/theme';

/** The page's sections in order, for the ones this plant has (the section bar between the corners) */
function sectionsOf(plant: PlantPageData | null, combinations: boolean): PageSection[] {
  if (!plant) return [];
  return [
    plant.images.length > 0 && { id: 'images', label: 'Φωτογραφίες' },
    { id: 'info', label: 'Πληροφορίες' },
    plant.lifecycles.length > 0 && { id: 'lifecycle', label: 'Κύκλος ζωής' },
    plant.diseases.length > 0 && { id: 'watch-out', label: 'Τι να προσέχεις' },
    plant.description && { id: 'description', label: 'Περιγραφή' },
    combinations && { id: 'combinations', label: 'Συνδυασμοί' },
    { id: 'ask', label: 'Ερώτηση' },
  ].filter((section): section is PageSection => !!section);
}

/** A section of the page: reports where it is (for the bar, the reveals and the description button) */
function Block({ onLayout, children }: { onLayout: (event: LayoutChangeEvent) => void; children: ReactNode }) {
  return (
    <View onLayout={onLayout} style={styles.block}>
      {children}
    </View>
  );
}

/** One plant's page, opened from a result: photos, characteristics, care, from the database */
export default function PlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const { plant, state, retry } = usePlant(Number(id));
  const combination = useCombinationPlants(plant?.combinationId ?? null, plant?.id ?? 0);
  const sections = useMemo(
    () => sectionsOf(plant, combination.length > 0),
    [plant, combination.length],
  );
  const order = useMemo(() => sections.map((section) => section.id), [sections]);
  const page = usePageSections(order, topClearance);
  const { current, atHeader, seen, below, register, scrollTo, scrollRef, onScrollY } = page;

  // The scroll on the UI thread: the photos pushed back, the thumbnails, the page's colour, the life cycle
  const scroll = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scroll.set(event.contentOffset.y);
    scheduleOnRN(onScrollY, event.contentOffset.y);
  });
  const hasPhotos = (plant?.images.length ?? 0) > 0;

  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

  // The section bar between the corner buttons, while this page is shown
  const header = useMemo(
    () =>
      sections.length > 1 ? (
        <SectionBar sections={sections} current={current} onPick={scrollTo} onPhotos={atHeader === 'images'} />
      ) : null,
    [sections, current, atHeader, scrollTo],
  );
  usePageHeader(header);


  if (state === 'loading') {
    // The same as the zoom from a search result opened onto: its photo and name, gray bars for the rest
    return (
      <View style={styles.root}>
        <PlantSkeleton plant={previewOf('plant', Number(id))} topClearance={topClearance} />
      </View>
    );
  }
  if (state === 'error' || !plant) {
    return (
      <View style={[styles.notFound, { marginTop: topClearance }]}>
        <AppText color={colors.inkMuted} style={styles.center}>
          Το φυτό δεν βρέθηκε ή δεν ήταν δυνατή η φόρτωσή του.
        </AppText>
        <PillButton label="Δοκίμασε ξανά" onPress={retry} />
      </View>
    );
  }

  const lifespan = lifespanLabel(plant.lifespanMin, plant.lifespanMax);
  const restrictions = restrictionRows(plant);
  const photos = plant.images.map((image) => image.url);
  const askAbout = { id: plant.id, name: plant.name, image: photos[0] ?? null };
  // «Δες την περιγραφή» while the description is still below the screen
  const showDescriptionButton = !!plant.description && below.has('description');
  // The tiles' animations run while the top of the page is in view
  const tilesPlaying = [current, atHeader].some((section) => section === 'images' || section === 'info');

  return (
    <View style={styles.root}>
      <BotanicalBackground scrollY={scroll} />
      {/* The photos start at the very top, under the corner buttons; without photos the title clears them */}
      <Animated.ScrollView
        ref={scrollRef as never}
        onLayout={page.scrollProps.onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.page,
          photos.length === 0 && { paddingTop: topClearance - space.lg },
          plant.description && { paddingBottom: space.lg + DESCRIPTION_BUTTON_HEIGHT + space.sm },
        ]}>
        {photos.length > 0 && (
          <View onLayout={register('images')}>
            <PhotoHeader
              photos={photos}
              label={plant.name}
              scrollY={scroll}
              index={photoIndex}
              onIndexChange={setPhotoIndex}
            />
          </View>
        )}

        <Block onLayout={register('info')}>
          <View style={styles.titleBlock}>
            {/* The big flat flower behind the lifespan pill, half off the screen's right edge: pushed further out
                near the top or bottom of the screen like the background's shapes, and turning a little as the page scrolls */}
            <EdgeDrift scrollY={scroll} side="right" size={TITLE_FLOWER.size} turn={TITLE_FLOWER.turn} style={styles.titleFlower}>
              <FlowerShape size={TITLE_FLOWER.size} color={botanical.coral} center={botanical.terracotta} rotate={12} opacity={0.9} style={styles.fill} />
            </EdgeDrift>
            <ChipRow plant={plant} />
            <View style={styles.titleRow}>
              <AppText accessibilityRole="header" color={botanical.ink} style={styles.name}>
                {plant.name}
              </AppText>
              {lifespan && (
                <View style={styles.pricePill}>
                  <AppText bold color={botanical.terracotta} style={styles.price}>
                    {lifespan}
                  </AppText>
                </View>
              )}
            </View>
            <AppText color={botanical.ink} style={styles.scientific}>
              {plant.scientificName}
            </AppText>
          </View>
          <DateRows plant={plant} />
          <PlantTiles plant={plant} playing={tilesPlaying} />
          <InfoRows rows={restrictions} />
          {NOTES.map((note) => (
            <NoteSection key={note.key} plant={plant} note={note} />
          ))}
        </Block>

        {plant.lifecycles.length > 0 && (
          <Block onLayout={register('lifecycle')}>
            <LifecycleCard
              stages={plant.lifecycles}
              // The buttons just under the corner buttons
              onReveal={(y) =>
                scrollRef.current?.scrollTo({ y: Math.max(0, page.scrollY.current + y - topClearance - space.sm) })
              }
            />
          </Block>
        )}

        {/* Optional sections: shown only when the plant has them */}
        {plant.diseases.length > 0 && (
          <Block onLayout={register('watch-out')}>
            <WatchOutSection plant={plant} />
          </Block>
        )}
        {plant.description && (
          <Block onLayout={register('description')}>
            {/* A card in the tiles' style: the beige tint and paper grain */}
            <View style={[styles.descriptionShadow, { backgroundColor: tileTone(0).background }]}>
              <View style={[styles.descriptionCard, { backgroundColor: tileTone(0).background }]}>
                <PaperGrain opacity={tileGrain} />
                <Section title="Περιγραφή" titleStyle={sectionTitle}>
                  {/* The editor's formatted text (or an older plain one with blog links) */}
                  <LightUpText doc={parseRichContent(plant.description)} play={seen.has('description')} />
                </Section>
              </View>
            </View>
          </Block>
        )}

        {/* The other plants of its combination */}
        {combination.length > 0 && (
          <Block onLayout={register('combinations')}>
            <Section title="Συνδυασμοί με αυτό το φυτό" titleStyle={sectionTitle}>
              <PlantCarousel plants={combination} />
            </Section>
          </Block>
        )}

        {/* Last: a question about this plant, posted linked to it */}
        <Block onLayout={register('ask')}>
          <AskCard plant={askAbout} cardStyle={styles.askCard} />
        </Block>
      </Animated.ScrollView>

      {/* Behind the corner buttons and the section labels, once the photos have scrolled past */}
      {/* (the photos rise at PHOTO_RISE of the page's speed: it starts when their bottom reaches the bar,
          or once they have faded out, whichever comes first) */}
      <TopBlur
        scrollY={scroll}
        // As far from the band's top to the corner buttons as from them to its bottom
        height={2 * topClearance - size.touch - 2 * space.sm}
        from={hasPhotos ? Math.min((PHOTO_HEIGHT - topClearance) / PHOTO_RISE, PHOTO_GONE_AT) : 0}
      />

      {/* The thumbnails over the page: on the photos' edge, then stacked at the top right */}
      {photos.length > 0 && (
        <PhotoStack
          photos={photos}
          index={photoIndex}
          scrollY={scroll}
          // In the row: that photo at the top; in the pile: it opens over the page
          onPick={setPhotoIndex}
          onOpen={(i, from) => setLightbox({ index: i, from })}
        />
      )}

      <DescriptionButton visible={showDescriptionButton} onPress={() => scrollTo('description')} />

      {lightbox && <PhotoLightbox photos={photos} photo={lightbox} label={plant.name} onClose={() => setLightbox(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: botanical.page,
  },
  page: {
    paddingBottom: space.lg,
  },
  // Every section: side margins and the gap above it
  block: {
    gap: space.lg,
    paddingHorizontal: space.md,
    paddingTop: space.lg,
  },
  // The squares' shadow, on an outer view (the card clips its grain)
  descriptionShadow: {
    borderRadius: radius.md,
    ...tileShadowStyle,
  },
  descriptionCard: {
    padding: space.md,
    paddingBottom: space.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  // The question card in the page's cream, without its shadow
  askCard: {
    borderRadius: radius.md,
    borderColor: botanical.line,
    backgroundColor: botanical.cream,
    boxShadow: 'none',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  // The plant's name in a big uppercase serif, the scientific name in italics under it (the mockup's «GERANIUM»)
  name: {
    flexShrink: 1,
    fontFamily: serif,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // A cream pill over the flower, the lifespan in terracotta
  pricePill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.full,
    backgroundColor: botanical.cream,
    ...tileShadowStyle,
  },
  price: {
    fontSize: 18,
    lineHeight: 24,
  },
  scientific: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 19,
    lineHeight: 24,
  },
  titleFlower: {
    right: -space.md - 70,
    top: 6,
  },
  fill: {
    left: 0,
    top: 0,
  },
  titleBlock: {
    gap: space.sm,
  },
  notFound: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  center: {
    textAlign: 'center',
  },
});
