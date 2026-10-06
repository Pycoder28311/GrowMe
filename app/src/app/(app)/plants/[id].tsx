import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { LifeCycleCard } from '@/components/plants/life-cycle-card';
import { PlantFacts } from '@/components/plants/plant-facts';
import { PlantGallery } from '@/components/plants/plant-gallery';
import { RelatedPlants } from '@/components/plants/related-plants';
import { AppText } from '@/components/ui/app-text';
import { BulletList } from '@/components/ui/bullet-list';
import { Section } from '@/components/ui/section';
import { plantDetails, plantGallery } from '@/config/plant-details';
import { PLANTS } from '@/config/plants';
import { colors, radius, size, space } from '@/theme';

/** One plant's page, opened from a result: photos, characteristics, care and related plants */
export default function PlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const plant = PLANTS.find((p) => p.id === id);

  if (!plant) {
    return (
      <AppText color={colors.inkMuted} style={[styles.notFound, { marginTop: topClearance }]}>
        Το φυτό δεν βρέθηκε.
      </AppText>
    );
  }

  const details = plantDetails(plant);
  const related = PLANTS.filter((p) => details.relatedIds.includes(p.id));

  return (
    // The photos start at the very top, under the corner buttons
    <ScrollView contentContainerStyle={styles.page}>
      <PlantGallery photos={plantGallery(plant)} label={plant.name} />

      <View style={styles.body}>
        <View>
          <View style={styles.titleRow}>
            <AppText size="big" bold accessibilityRole="header" style={styles.name}>
              {plant.name}
            </AppText>
            <AppText bold color={colors.accent}>
              {plant.price.min}–{plant.price.max} €
            </AppText>
          </View>
          {details.scientificName !== '' && (
            <AppText size="small" color={colors.inkMuted}>
              {details.scientificName}
            </AppText>
          )}
        </View>

        <PlantFacts plant={plant} details={details} />
        <LifeCycleCard milestones={details.lifecycle} />

        {/* Optional sections: shown only when the plant has them */}
        {details.tips.length > 0 && (
          <Section title="Συμβουλές">
            <BulletList items={details.tips} />
          </Section>
        )}
        {details.diseases.length > 0 && (
          <Section title="Ασθένειες">
            <BulletList
              items={details.diseases.map((disease) => (
                <>
                  <AppText bold>{disease.name}:</AppText> {disease.text}
                </>
              ))}
            />
          </Section>
        )}
        {details.description && (
          <Section title="Περιγραφή">
            <AppText>{details.description}</AppText>
          </Section>
        )}

        {related.length > 0 && (
          <Section title="Σχετικά φυτά">
            <RelatedPlants plants={related} />
          </Section>
        )}

        {/* Placeholder: the combinations content comes later */}
        <Section title="Συνδυασμοί με αυτό το φυτό">
          <View style={styles.combinations} />
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
    textAlign: 'center',
  },
});
