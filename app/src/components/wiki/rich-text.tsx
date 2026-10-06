import type { RichBlock, RichDoc, RichInline, RichListItem, RichMark } from '@growme/shared';
import { Fragment } from 'react';
import { Linking, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, fontFamily, radius, space } from '@/theme';

// Shows an article written with the dashboard's editor: headings, paragraphs, lists, quotes, lines,
// and bold / italic / underline / strike / links inside the text. Native views only (no HTML).

/** Opens web and email links only (the server allows nothing else either) */
const openLink = (href: string) => {
  if (/^(https?:\/\/|mailto:)/i.test(href)) Linking.openURL(href).catch(() => {});
};

function markStyle(marks: RichMark[] = []): TextStyle {
  const style: TextStyle = {};
  const lines: string[] = [];
  for (const mark of marks) {
    if (mark.type === 'bold') style.fontFamily = fontFamily.bold;
    if (mark.type === 'italic') style.fontStyle = 'italic';
    if (mark.type === 'underline' || mark.type === 'link') lines.push('underline');
    if (mark.type === 'strike') lines.push('line-through');
    if (mark.type === 'link') style.color = colors.primary;
  }
  if (lines.length) style.textDecorationLine = lines.join(' ') as TextStyle['textDecorationLine'];
  return style;
}

/** The text pieces of a paragraph or heading, nested inside its AppText */
function Inlines({ content }: { content?: RichInline[] }) {
  return (
    <>
      {(content ?? []).map((node, i) => {
        if (node.type === 'hardBreak') return <Fragment key={i}>{'\n'}</Fragment>;
        const link = node.marks?.find((m): m is Extract<RichMark, { type: 'link' }> => m.type === 'link');
        return (
          <Text
            key={i}
            style={markStyle(node.marks)}
            onPress={link ? () => openLink(link.attrs.href) : undefined}
            accessibilityRole={link ? 'link' : undefined}>
            {node.text}
          </Text>
        );
      })}
    </>
  );
}

function ListItems({ items, ordered, start = 1 }: { items: RichListItem[]; ordered: boolean; start?: number }) {
  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          {ordered ? (
            <AppText bold color={colors.primary} style={styles.number}>
              {start + i}.
            </AppText>
          ) : (
            <View style={styles.dot} />
          )}
          <View style={styles.listBody}>
            <Blocks blocks={item.content} tight />
          </View>
        </View>
      ))}
    </View>
  );
}

function Block({ block }: { block: RichBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <AppText style={[styles.paragraph, { textAlign: block.attrs?.textAlign ?? 'left' }]}>
          <Inlines content={block.content} />
        </AppText>
      );
    case 'heading':
      return (
        <AppText
          size={block.attrs.level === 2 ? 'big' : 'normal'}
          bold
          accessibilityRole="header"
          style={[styles.heading, { textAlign: block.attrs.textAlign ?? 'left' }]}>
          <Inlines content={block.content} />
        </AppText>
      );
    case 'bulletList':
      return <ListItems items={block.content} ordered={false} />;
    case 'orderedList':
      return <ListItems items={block.content} ordered start={block.attrs?.start ?? 1} />;
    case 'blockquote':
      return (
        <View style={styles.quote}>
          <Blocks blocks={block.content} tight />
        </View>
      );
    case 'horizontalRule':
      return <View style={styles.rule} />;
  }
}

function Blocks({ blocks, tight }: { blocks: RichBlock[]; tight?: boolean }) {
  return (
    <View style={tight ? styles.tight : styles.blocks}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </View>
  );
}

/** An article's formatted text */
export function RichText({ doc }: { doc: RichDoc }) {
  return <Blocks blocks={doc.content} />;
}

const styles = StyleSheet.create({
  blocks: {
    gap: space.sm,
  },
  tight: {
    gap: space.xs,
  },
  paragraph: {
    lineHeight: space.lg,
  },
  // More room above a heading than below, so it starts a new part
  heading: {
    marginTop: space.sm,
  },
  list: {
    gap: space.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: space.sm,
  },
  // Lined up with the middle of the first text line
  dot: {
    width: space.sm,
    height: space.sm,
    marginTop: space.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  number: {
    minWidth: space.md,
    lineHeight: space.lg,
  },
  listBody: {
    flex: 1,
  },
  quote: {
    borderLeftWidth: space.xs,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  rule: {
    height: 2,
    marginVertical: space.sm,
    backgroundColor: colors.border,
  },
});
