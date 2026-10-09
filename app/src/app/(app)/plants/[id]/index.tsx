import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { LifecycleCard } from '@/components/plants/lifecycle/lifecycle-card';
import { PlantBadges } from '@/components/plants/plant-badges';
import { PlantFacts } from '@/components/plants/plant-facts';
import { PlantGallery } from '@/components/plants/plant-gallery';
import { AppText } from '@/components/ui/app-text';
import { LinkedText } from '@/components/ui/linked-text';
import { BulletList } from '@/components/ui/bullet-list';
import { PillButton } from '@/components/ui/pill-button';
import { Section } from '@/components/ui/section';
import { priceLabel } from '@/config/plant-traits';
import { usePlant } from '@/lib/plants';
import { colors, radius, size, space } from '@/theme';

/** One plant's page, opened from a result: photos, characteristics, care, from the database */
export default function PlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const { plant, state, retry } = usePlant(Number(id));
  const page = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  if (state === 'loading') {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: topClearance }} />;
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

  return (
    // The photos start at the very top, under the corner buttons; without photos the title clears them
    <ScrollView
      ref={page}
      onScroll={(event) => (scrollY.current = event.nativeEvent.contentOffset.y)}
      scrollEventThrottle={32}
      contentContainerStyle={[styles.page, photos.length === 0 && { paddingTop: topClearance }]}>
      {photos.length > 0 && <PlantGallery photos={photos} label={plant.name} />}

      <View style={styles.body}>
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
        <PlantBadges plant={plant} />

        <PlantFacts plant={plant} />
        {plant.lifecycles.length > 0 && (
          <LifecycleCard
            plantId={plant.id}
            stages={plant.lifecycles}
            // The stage's group label just under the corner buttons
            onRevealOutside={(row) =>
              row.measureInWindow((_, y) =>
                page.current?.scrollTo({ y: Math.max(0, scrollY.current + y - topClearance - space.md) }),
              )
            }
          />
        )}

        {/* Optional sections: shown only when the plant has them */}
        {plant.tips.length > 0 && (
          <Section title="Συμβουλές">
            <BulletList
              items={plant.tips.map((tip) => (
                <>
                  <AppText bold>{tip.title}:</AppText> <LinkedText>{tip.content}</LinkedText>
                </>
              ))}
            />
          </Section>
        )}
        {plant.diseases.length > 0 && (
          <Section title="Ασθένειες">
            <BulletList
              items={plant.diseases.map((disease) => (
                <>
                  <AppText bold>
                    {disease.title}
                    {disease.label ? ` (${disease.label})` : ''}:
                  </AppText>{' '}
                  <LinkedText>{disease.content}</LinkedText>
                </>
              ))}
            />
          </Section>
        )}
        {plant.description && (
          <Section title="Περιγραφή">
            <LinkedText>{plant.description}</LinkedText>
          </Section>
        )}

        {/* Placeholder: the combinations content comes later */}
        <Section title="Συνδυασμοί με αυτό το φυτό">
          {plant.combination ? (
            <AppText bold>{plant.combination.title}</AppText>
          ) : (
            <View style={styles.combinations} />
          )}
        </Section>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: space.lg,
  },
  body: {
    gap: space.lg,
    paddingHorizontal: space.md,
    paddingTop: space.md,
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
