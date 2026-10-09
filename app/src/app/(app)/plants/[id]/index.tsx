import type { Plant } from '@growme/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { usePageHeader } from '@/components/layout/page-header';
import { LightUpText } from '@/components/motion/light-up-text';
import { Reveal } from '@/components/motion/reveal';
import { DESCRIPTION_BUTTON_HEIGHT, DescriptionButton } from '@/components/plants/description-button';
import { LifecycleCard } from '@/components/plants/lifecycle/lifecycle-card';
import { PlantFacts } from '@/components/plants/plant-facts';
import { PlantGallery } from '@/components/plants/plant-gallery';
import { PlantTiles } from '@/components/plants/plant-tiles';
import { SectionBar, type PageSection } from '@/components/plants/section-bar';
import { TipsList } from '@/components/plants/tips-list';
import { WatchOutList } from '@/components/plants/watch-out-list';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { Section } from '@/components/ui/section';
import { priceLabel } from '@/config/plant-traits';
import { usePageSections } from '@/lib/page-sections';
import { usePlant } from '@/lib/plants';
import { colors, radius, size, space } from '@/theme';

/** The page's sections in order, for the ones this plant has (the section bar between the corners) */
function sectionsOf(plant: Plant | null): PageSection[] {
  if (!plant) return [];
  return [
    plant.images.length > 0 && { id: 'images', label: 'Φωτογραφίες' },
    { id: 'info', label: 'Πληροφορίες' },
    plant.lifecycles.length > 0 && { id: 'lifecycle', label: 'Κύκλος ζωής' },
    plant.tips.length > 0 && { id: 'tips', label: 'Συμβουλές' },
    plant.diseases.length > 0 && { id: 'watch-out', label: 'Τι να προσέχεις' },
    plant.description && { id: 'description', label: 'Περιγραφή' },
    { id: 'combinations', label: 'Συνδυασμοί' },
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
  const { id, via } = useLocalSearchParams<{ id: string; via?: string }>();
  const topClearance = useTopClearance();
  const { plant, state, retry } = usePlant(Number(id));

  const sections = useMemo(() => sectionsOf(plant), [plant]);
  const order = useMemo(() => sections.map((section) => section.id), [sections]);
  const page = usePageSections(order, topClearance);
  const { current, atHeader, seen, below, register, scrollTo, scrollRef, scrollY } = page;

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
  const photos = plant.images.map((image) => ({ uri: image.url }));
  // «Δες την περιγραφή» while the description is still below the screen
  const showDescriptionButton = !!plant.description && below.has('description');

  return (
    <View style={styles.root}>
      {screen}
      {/* The photos start at the very top, under the corner buttons; without photos the title clears them */}
      <ScrollView
        {...page.scrollProps}
        contentContainerStyle={[
          styles.page,
          photos.length === 0 && { paddingTop: topClearance - space.lg },
          plant.description && { paddingBottom: space.lg + DESCRIPTION_BUTTON_HEIGHT + space.sm },
        ]}>
        {photos.length > 0 && (
          <View onLayout={register('images')}>
            <PlantGallery photos={photos} label={plant.name} />
          </View>
        )}

        <Block onLayout={register('info')}>
          <View>
            <View style={styles.titleRow}>
              <AppText size="big" bold accessibilityRole="header" style={styles.name}>
                {plant.name}
              </AppText>
              {price && (
                <AppText bold color={colors.accent}>
                  {price}
                </AppText>
              )}
            </View>
            <AppText size="small" color={colors.inkMuted}>
              {plant.scientificName}
            </AppText>
          </View>
          <PlantTiles plant={plant} />
          <PlantFacts plant={plant} />
        </Block>

        {plant.lifecycles.length > 0 && (
          <Block onLayout={register('lifecycle')}>
            <LifecycleCard
              plantId={plant.id}
              stages={plant.lifecycles}
              // The stage's group label just under the corner buttons
              onRevealOutside={(row) =>
                row.measureInWindow((_, y) =>
                  scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + y - topClearance - space.md) }),
                )
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
            <Reveal from="behind" visible={seen.has('watch-out')}>
              <WatchOutList items={plant.diseases} />
            </Reveal>
          </Block>
        )}
        {plant.description && (
          <Block onLayout={register('description')}>
            <Reveal from="pop" visible={seen.has('description')}>
              <Section title="Περιγραφή">
                <LightUpText play={seen.has('description')}>{plant.description}</LightUpText>
              </Section>
            </Reveal>
          </Block>
        )}

        {/* Placeholder: the combinations content comes later */}
        <Block onLayout={register('combinations')}>
          <Section title="Συνδυασμοί με αυτό το φυτό">
            {plant.combination ? (
              <AppText bold>{plant.combination.title}</AppText>
            ) : (
              <View style={styles.combinations} />
            )}
          </Section>
        </Block>
      </ScrollView>

      <DescriptionButton visible={showDescriptionButton} onPress={() => scrollTo('description')} />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  name: {
    flexShrink: 1,
  },
  combinations: {
    width: size.touch * 4,
    height: size.touch * 4,
    borderRadius: radius.md,
    backgroundColor: colors.border,
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
