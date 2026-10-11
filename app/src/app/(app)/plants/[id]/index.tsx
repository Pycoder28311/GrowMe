import { parseRichContent, type Plant } from '@growme/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { useTopClearance } from '@/components/layout/app-shell';
import { usePageHeader } from '@/components/layout/page-header';
import { LightUpText } from '@/components/motion/light-up-text';
import { Reveal } from '@/components/motion/reveal';
import { DESCRIPTION_BUTTON_HEIGHT, DescriptionButton } from '@/components/plants/description-button';
import { LifecycleCard } from '@/components/plants/lifecycle/lifecycle-card';
import { PHOTO_GONE_AT, PHOTO_HEIGHT, PHOTO_RISE, PhotoHeader } from '@/components/plants/photo-header';
import { PhotoLightbox, type LightboxPhoto } from '@/components/plants/photo-lightbox';
import { PhotoStack } from '@/components/plants/photo-stack';
import { cardFromIndex, PlantCard } from '@/components/plants/plant-card';
import { PlantCarousel } from '@/components/plants/plant-carousel';
import { PlantingMonths, PlantTiles } from '@/components/plants/plant-tiles';
import { SectionBar, type PageSection } from '@/components/plants/section-bar';
import { SunBar } from '@/components/plants/sun-graph';
import { TipsList } from '@/components/plants/tips-list';
import { TopBlur } from '@/components/plants/top-blur';
import { TraitRows } from '@/components/plants/trait-rows';
import { WatchOutList } from '@/components/plants/watch-out-list';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { Section } from '@/components/ui/section';
import { priceLabel } from '@/config/plant-traits';
import { usePageSections } from '@/lib/page-sections';
import { useCombinationPlants, usePlant, useRelatedPlants } from '@/lib/plants';
import { colors, space } from '@/theme';

/** The page turns from white at the top to this light orange at the bottom */
const PAGE_BOTTOM = '#fff1e5';

/** The page's sections in order, for the ones this plant has (the section bar between the corners) */
function sectionsOf(plant: Plant | null, combinations: boolean, related: boolean): PageSection[] {
  if (!plant) return [];
  return [
    plant.images.length > 0 && { id: 'images', label: 'Φωτογραφίες' },
    { id: 'info', label: 'Πληροφορίες' },
    plant.lifecycles.length > 0 && { id: 'lifecycle', label: 'Κύκλος ζωής' },
    plant.tips.length > 0 && { id: 'tips', label: 'Συμβουλές' },
    plant.diseases.length > 0 && { id: 'watch-out', label: 'Τι να προσέχεις' },
    plant.description && { id: 'description', label: 'Περιγραφή' },
    combinations && { id: 'combinations', label: 'Συνδυασμοί' },
    related && { id: 'related', label: 'Σχετικά φυτά' },
  ].filter((section): section is PageSection => !!section);
}

/** How tall the soft edge between the page's colour and a white band is */
const BAND_EDGE = 20;

/** A short gradient at a white band's edge, from transparent to its white, so the two colours meet softly */
function BandEdge({ side }: { side: 'top' | 'bottom' }) {
  const id = `band-edge-${side}-${useId().replace(/:/g, '')}`;
  const top = side === 'top';
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height={BAND_EDGE}
      style={[styles.bandEdge, top ? { top: -BAND_EDGE } : { bottom: -BAND_EDGE }]}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.surface} stopOpacity={top ? 0 : 1} />
          <Stop offset="1" stopColor={colors.surface} stopOpacity={top ? 1 : 0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height={BAND_EDGE} fill={`url(#${id})`} />
    </Svg>
  );
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
  const { id, via } = useLocalSearchParams<{ id: string; via?: string }>();
  const topClearance = useTopClearance();
  const { plant, state, retry } = usePlant(Number(id));
  const combination = useCombinationPlants(plant?.combinationId ?? null, plant?.id ?? 0);
  const related = useRelatedPlants(
    plant,
    combination.map((other) => other.id),
  );

  const sections = useMemo(
    () => sectionsOf(plant, combination.length > 0, related.length > 0),
    [plant, combination.length, related.length],
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
  const tint = useAnimatedStyle(() => {
    // White under the photos, reaching the light orange as they finish fading out at the top
    const start = hasPhotos ? PHOTO_HEIGHT * 0.2 : 0;
    const end = hasPhotos ? PHOTO_GONE_AT : PHOTO_HEIGHT * 0.5;
    return { backgroundColor: interpolateColor(scroll.get(), [start, end], [colors.surface, PAGE_BOTTOM]) };
  });

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

  // A plant slides up from a card; from the search its result grows into it, so it only fades
  const screen = <Stack.Screen options={{ animation: via === 'search' ? 'fade' : 'slide_from_bottom' }} />;

  if (state === 'loading') {
    return (
      <>
        {screen}
        <ActivityIndicator color={colors.primary} style={{ marginTop: topClearance }} />
      </>
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

  const price = priceLabel(plant);
  const photos = plant.images.map((image) => image.url);
  // «Δες την περιγραφή» while the description is still below the screen
  const showDescriptionButton = !!plant.description && below.has('description');
  // The tiles' animations run while the top of the page is in view
  const tilesPlaying = [current, atHeader].some((section) => section === 'images' || section === 'info');

  return (
    <View style={styles.root}>
      {screen}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, tint]} />
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
          <View>
            <View style={styles.titleRow}>
              <AppText size="big" bold accessibilityRole="header" style={styles.name}>
                {plant.name}
              </AppText>
              {price && (
                <AppText bold color={colors.accent} style={styles.price}>
                  {price}
                </AppText>
              )}
            </View>
            <AppText color={colors.inkMuted} style={styles.scientific}>
              {plant.scientificName}
            </AppText>
          </View>
          <PlantingMonths plant={plant} />
          <PlantTiles plant={plant} playing={tilesPlaying} />
          <SunBar start={plant.sunStart} end={plant.sunEnd} />
          <TraitRows plant={plant} withLifespan={plant.lifecycles.length === 0} />
        </Block>

        {plant.lifecycles.length > 0 && (
          <Block onLayout={register('lifecycle')}>
            <LifecycleCard
              stages={plant.lifecycles}
              lifespan={plant.lifespan}
              scrollY={scroll}
              visibleTop={topClearance}
              // The buttons just under the corner buttons
              onReveal={(y) =>
                scrollRef.current?.scrollTo({ y: Math.max(0, page.scrollY.current + y - topClearance - space.sm) })
              }
            />
          </Block>
        )}

        {/* Optional sections: shown only when the plant has them, revealed the first time they come into view */}
        {plant.tips.length > 0 && (
          <Block onLayout={register('tips')}>
            <Reveal from="behind" visible={seen.has('tips')}>
              <Section title="Συμβουλές">
                <TipsList tips={plant.tips} />
              </Section>
            </Reveal>
          </Block>
        )}
        {plant.diseases.length > 0 && (
          <Block onLayout={register('watch-out')}>
            <WatchOutList items={plant.diseases} />
          </Block>
        )}
        {plant.description && (
          <Block onLayout={register('description')}>
            {/* A white band across the whole width, square */}
            <View style={styles.descriptionBand}>
              {/* A short fade from the page's colour into the white, above and below */}
              <BandEdge side="top" />
              <BandEdge side="bottom" />
              <Section title="Περιγραφή">
                {/* The editor's formatted text (or an older plain one with blog links) */}
                <LightUpText doc={parseRichContent(plant.description)} play={seen.has('description')} />
              </Section>
            </View>
          </Block>
        )}

        {/* The other plants of its combination, then plants like it */}
        {combination.length > 0 && (
          <Block onLayout={register('combinations')}>
            <Section title="Συνδυασμοί με αυτό το φυτό">
              <PlantCarousel plants={combination} />
            </Section>
          </Block>
        )}
        {related.length > 0 && (
          <Block onLayout={register('related')}>
            {/* The same cards as the results page */}
            <Section title="Σχετικά φυτά">
              <View style={styles.related}>
                {related.map((other) => (
                  <PlantCard key={other.id} plant={cardFromIndex(other)} />
                ))}
              </View>
            </Section>
          </Block>
        )}
      </Animated.ScrollView>

      {/* Behind the corner buttons and the section labels, once the photos have scrolled past */}
      {/* (the photos rise at PHOTO_RISE of the page's speed: it starts when their bottom reaches the bar,
          or once they have faded out, whichever comes first) */}
      <TopBlur
        scrollY={scroll}
        height={topClearance}
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
  // Out to the screen's edges (past the blocks' side padding), the text keeping its margins
  descriptionBand: {
    marginHorizontal: -space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
  },
  bandEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  // The plant's name, price and scientific name: a size up from the usual title, body and small text
  name: {
    flexShrink: 1,
    fontSize: 30,
    lineHeight: 36,
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
  },
  scientific: {
    fontSize: 16,
    lineHeight: 22,
  },
  related: {
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
