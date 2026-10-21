import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AccentBlock } from '@/components/plants/accent-block';
import { AppText } from '@/components/ui/app-text';
import { Section } from '@/components/ui/section';
import { TextPanel } from '@/components/ui/text-panel';
import { WATCH_OUT_ITEMS, type PlantPageData } from '@/config/plant-page';
import { botanical, radius, sectionTitle, smallCaps, space, tileTone } from '@/theme';

/**
 * «Τι να προσέχεις»: the plant's issues (diseases and pests). One issue shows at a time (pills above, when
 * there are several: the one picked filled in terracotta), each as the same three static blocks, «Τι βλέπω»,
 * «Τι είναι», «Τι κάνω», in the tiles' style; a block with no text is left out and a long text opens in the
 * panel from below.
 */
export function WatchOutSection({ plant }: { plant: PlantPageData }) {
  const issues = plant.diseases;
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [shown, setShown] = useState<{ title: string; text: string } | null>(null);
  const issue = issues.find((item) => item.id === pickedId) ?? issues[0];
  if (!issue) return null;

  return (
    <Section title="Τι να προσέχεις" titleStyle={sectionTitle}>
      {issues.length > 1 && (
        <View accessibilityRole="tablist" style={styles.pills}>
          {issues.map((item) => {
            const on = item.id === issue.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setPickedId(item.id)}
                style={({ pressed }) => [styles.pill, on && styles.pillOn, pressed && styles.pressed]}>
                <AppText bold={on} color={on ? botanical.cream : botanical.ink}>
                  {item.title}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
      {issue.label && (
        <AppText color={botanical.terracotta} style={[smallCaps, styles.label]}>
          {issue.label}
        </AppText>
      )}
      <View accessibilityRole="list" style={styles.blocks}>
        {WATCH_OUT_ITEMS.map(({ key, title, icon, tone }) => {
          const text = issue[key];
          return text ? (
            <AccentBlock
              key={key}
              title={title}
              text={text}
              icon={icon}
              tone={tileTone(tone)}
              onOpen={() => setShown({ title: `${issue.title}: ${title}`, text })}
            />
          ) : null;
        })}
      </View>
      {shown && <TextPanel title={shown.title} text={shown.text} onClose={() => setShown(null)} />}
    </Section>
  );
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.sm + 2,
  },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 3,
    borderRadius: radius.full,
    backgroundColor: botanical.cream,
    borderWidth: 1,
    borderColor: botanical.line,
  },
  pillOn: {
    backgroundColor: botanical.terracotta,
    borderColor: botanical.terracotta,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    marginBottom: space.sm,
  },
  blocks: {
    gap: space.sm + space.xs,
  },
});
