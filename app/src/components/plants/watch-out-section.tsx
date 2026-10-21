import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccentBlock } from '@/components/plants/accent-block';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { TextPanel } from '@/components/ui/text-panel';
import { WATCH_OUT_ITEMS, type PlantPageData } from '@/config/plant-page';
import { colors, space } from '@/theme';

/**
 * «Τι να προσέχεις»: the plant's issues (diseases and pests). One issue shows at a time (chips above, when
 * there are several), each as the same three static blocks, «Τι βλέπω», «Τι είναι», «Τι κάνω», in the tips'
 * look; a block with no text is left out and a long text opens in the panel from below.
 */
export function WatchOutSection({ plant }: { plant: PlantPageData }) {
  const issues = plant.diseases;
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [shown, setShown] = useState<{ title: string; text: string } | null>(null);
  const issue = issues.find((item) => item.id === pickedId) ?? issues[0];
  if (!issue) return null;

  return (
    <Section title="Τι να προσέχεις">
      {issues.length > 1 && (
        <View style={styles.chips}>
          {issues.map((item) => (
            <Chip key={item.id} label={item.title} selected={item.id === issue.id} onToggle={() => setPickedId(item.id)} />
          ))}
        </View>
      )}
      {issue.label && (
        <AppText size="small" bold color={colors.accent} style={styles.label}>
          {issue.label}
        </AppText>
      )}
      <View accessibilityRole="list" style={styles.blocks}>
        {WATCH_OUT_ITEMS.map(({ key, title }) => {
          const text = issue[key];
          return text ? <AccentBlock key={key} title={title} text={text} onOpen={() => setShown({ title: `${issue.title}: ${title}`, text })} /> : null;
        })}
      </View>
      {shown && <TextPanel title={shown.title} text={shown.text} onClose={() => setShown(null)} />}
    </Section>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.sm,
  },
  label: {
    marginBottom: space.xs,
  },
  blocks: {
    gap: space.sm + space.xs,
  },
});
