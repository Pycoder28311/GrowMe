import { StyleSheet } from 'react-native';

import { LinkedText } from '@/components/ui/linked-text';
import { Section } from '@/components/ui/section';
import { NOTES, type PlantPageData } from '@/config/plant-page';

/** A plant's short text under a title («Ηξερες οτι», «Μυστικό επιτυχίας»); nothing when the plant has none */
export function NoteSection({ plant, note }: { plant: PlantPageData; note: (typeof NOTES)[number] }) {
  const text = plant[note.key];
  if (!text) return null;
  return (
    <Section title={note.title}>
      <LinkedText style={styles.text}>{text}</LinkedText>
    </Section>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
