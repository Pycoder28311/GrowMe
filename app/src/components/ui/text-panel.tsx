import { parseRichContent } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { RichText } from '@/components/wiki/rich-text';
import { colors, space } from '@/theme';

/**
 * A text in a panel sliding up from below (e.g. one «Τι να προσέχεις» item): title, a label, the text.
 * The text is the editor's (formatted, as JSON) or an older plain text with blog links: both show.
 */
export function TextPanel({
  title,
  label,
  text,
  onClose,
}: {
  title: string;
  label?: string | null;
  text: string;
  onClose: () => void;
}) {
  return (
    <BottomSheet title={title} initialSnap="half" onClose={onClose}>
      <View style={styles.body}>
        {label && (
          <AppText size="small" bold color={colors.accent}>
            {label}
          </AppText>
        )}
        <RichText doc={parseRichContent(text)} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space.sm,
  },
});
