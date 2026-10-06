import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PostBlock } from '@/config/wiki-posts';
import { space } from '@/theme';

/** A post's text: paragraphs, and bold headings that start each part (with more space above them) */
export function PostBody({ blocks }: { blocks: PostBlock[] }) {
  return (
    <View style={styles.body}>
      {blocks.map((block, index) =>
        block.type === 'heading' ? (
          <AppText key={index} bold accessibilityRole="header" style={index > 0 && styles.heading}>
            {block.text}
          </AppText>
        ) : (
          <AppText key={index} style={styles.paragraph}>
            {block.text}
          </AppText>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space.xs,
  },
  heading: {
    marginTop: space.md,
  },
  paragraph: {
    lineHeight: space.lg,
  },
});
