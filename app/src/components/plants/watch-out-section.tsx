import { parseRichContent, plainTextOf } from '@growme/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Section } from '@/components/ui/section';
import { RichText } from '@/components/wiki/rich-text';
import { WATCH_OUT_ITEMS, type PlantPageData } from '@/config/plant-page';
import { botanical, iconSize, radius, sectionTitle, serif, size, smallCaps, space, tileShadowStyle } from '@/theme';

type Issue = PlantPageData['diseases'][number];

/** One issue's row in the list: the book icon, its name and the start of what it looks like; the whole row is the button */
function IssueRow({ issue, onPress }: { issue: Issue; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={issue.title} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.circle}>
        <Icon name="book" size={iconSize.normal} color={botanical.olive} />
      </View>
      <View style={styles.rowText}>
        <AppText bold style={styles.rowTitle}>
          {issue.title}
        </AppText>
        {issue.symptoms ? (
          <AppText size="small" color={botanical.inkSoft} numberOfLines={1}>
            {plainTextOf(parseRichContent(issue.symptoms))}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** One section of an issue in the panel: a small uppercase title and the whole text, on the panel itself (no box around it) */
function SheetPart({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.part}>
      <AppText color={botanical.inkMuted} style={smallCaps}>
        {title}
      </AppText>
      <RichText doc={parseRichContent(text)} />
    </View>
  );
}

/** How many issues show before «Δες περισσότερα» */
const FIRST_ISSUES = 3;

/**
 * «Τι να προσέχεις»: the plant's issues (diseases and pests) as a plain list of rows, the first FIRST_ISSUES of them
 * until «Δες περισσότερα» shows the rest. Tapping a row opens a panel sliding up from below with the issue's three
 * sections: «Τι βλέπω», «Τι είναι» and «Τι κάνω» (one with no text is left out).
 */
export function WatchOutSection({ plant }: { plant: PlantPageData }) {
  const issues = plant.diseases;
  const [opened, setOpened] = useState<Issue | null>(null);
  const [showAll, setShowAll] = useState(false);
  if (issues.length === 0) return null;
  const hidden = !showAll && issues.length > FIRST_ISSUES;

  return (
    <Section title="Τι να προσέχεις" titleStyle={sectionTitle}>
      <View accessibilityRole="list" style={styles.rows}>
        {(hidden ? issues.slice(0, FIRST_ISSUES) : issues).map((issue) => (
          <IssueRow key={issue.id} issue={issue} onPress={() => setOpened(issue)} />
        ))}
        {hidden && (
          <PressableScale accessibilityRole="button" onPress={() => setShowAll(true)} pressedScale={0.98} style={styles.more}>
            <AppText bold color={botanical.olive}>
              Δες περισσότερα
            </AppText>
            <Icon name="chevronDown" size={iconSize.small} color={botanical.olive} bold />
          </PressableScale>
        )}
      </View>
      {opened && (
        <BottomSheet title={opened.title} initialSnap="half" onClose={() => setOpened(null)}>
          <View style={styles.sections}>
            {WATCH_OUT_ITEMS.map(({ key, title }) => {
              const text = opened[key];
              return text ? <SheetPart key={key} title={title} text={text} /> : null;
            })}
          </View>
        </BottomSheet>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md - 4,
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
  // «Δες περισσότερα»: on the rows' cream, a button's height, the text and arrow in the middle
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: size.touch,
    borderRadius: radius.md,
    backgroundColor: botanical.cream,
    borderWidth: 1,
    borderColor: botanical.line,
  },
  sections: {
    gap: space.lg,
  },
  part: {
    gap: space.xs,
  },
  // The book in an olive circle, like the page's date rows
  circle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: botanical.oliveSoft,
  },
});
