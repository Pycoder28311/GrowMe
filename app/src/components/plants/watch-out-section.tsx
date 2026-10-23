import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { AccentBlock } from '@/components/plants/accent-block';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { TextPanel } from '@/components/ui/text-panel';
import { WATCH_OUT_ITEMS, type PlantPageData } from '@/config/plant-page';
import { botanical, iconSize, radius, sectionTitle, serif, space, tileShadowStyle, tileTone } from '@/theme';

type Issue = PlantPageData['diseases'][number];

/** One issue's row: its name, what it looks like («Τι βλέπω») and a chevron that turns to point down while it is open */
function IssueRow({ issue, open, onPress }: { issue: Issue; open: boolean; onPress: () => void }) {
  const reduced = useReducedMotion();
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: reduced ? (open ? '90deg' : '0deg') : withTiming(open ? '90deg' : '0deg', { duration: 200 }) }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={issue.title}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <AppText bold style={styles.rowTitle}>
          {issue.title}
        </AppText>
        {issue.symptoms ? (
          <AppText size="small" color={botanical.inkSoft} numberOfLines={2}>
            {issue.symptoms}
          </AppText>
        ) : null}
      </View>
      <Animated.View style={arrow}>
        <Icon name="chevronRight" size={iconSize.big} color={botanical.ink} bold />
      </Animated.View>
    </Pressable>
  );
}

/**
 * «Τι να προσέχεις»: the plant's issues (diseases and pests) as rows, one under the other, each with its name and
 * what it looks like. Tapping a row opens it right under itself, with «Τι είναι» and «Τι κάνω» in the tiles' style (a block
 * with no text is left out, and a long text opens in the panel from below). One row is open at a time.
 */
export function WatchOutSection({ plant }: { plant: PlantPageData }) {
  const issues = plant.diseases;
  const [openId, setOpenId] = useState<number | null>(null);
  const [shown, setShown] = useState<{ title: string; text: string } | null>(null);
  if (issues.length === 0) return null;

  return (
    <Section title="Τι να προσέχεις" titleStyle={sectionTitle}>
      <View accessibilityRole="list" style={styles.rows}>
        {issues.map((issue) => {
          const open = issue.id === openId;
          return (
            <View key={issue.id} style={styles.item}>
              <IssueRow issue={issue} open={open} onPress={() => setOpenId(open ? null : issue.id)} />
              {open && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.blocks}>
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
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>
      {shown && <TextPanel title={shown.title} text={shown.text} onClose={() => setShown(null)} />}
    </Section>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: space.sm,
  },
  item: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: botanical.cream,
    borderWidth: 1,
    borderColor: botanical.line,
    ...tileShadowStyle,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: serif,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.8,
  },
  blocks: {
    gap: space.sm + space.xs,
  },
});
