import { parseBlogLinks } from '@growme/shared';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useBlogPreview } from '@/lib/blog-preview';
import { colors } from '@/theme';

type LinkedTextProps = Omit<ComponentProps<typeof AppText>, 'children'> & {
  /** Text from the dashboard: `[words](blog:12)` shows «words» in blue and opens that blog's panel */
  children: string;
};

/** A text that may link to blogs: the markers are hidden, the linked words are blue and tappable */
export function LinkedText({ children, ...props }: LinkedTextProps) {
  const openBlog = useBlogPreview();
  return (
    <AppText {...props}>
      {parseBlogLinks(children).map((part, i) =>
        'blogId' in part ? (
          <Text
            key={i}
            accessibilityRole="link"
            onPress={() => openBlog(part.blogId)}
            style={{ color: colors.link }}
            suppressHighlighting>
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </AppText>
  );
}
