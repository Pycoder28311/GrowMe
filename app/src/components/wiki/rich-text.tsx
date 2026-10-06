import type { ImageRef, RichBlock, RichDoc, RichImage, RichInline, RichListItem, RichMark } from '@growme/shared';
import { Image } from 'expo-image';
import { createContext, Fragment, useContext } from 'react';
import { Linking, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, fontFamily, radius, space } from '@/theme';

// Shows an article written with the dashboard's editor: headings, paragraphs, lists, quotes, lines,
// images, and bold / italic / underline / strike / links inside the text. Native views only (no HTML).

/** Image URLs by id (the document stores only ids) */
const ImageUrls = createContext<Map<number, string>>(new Map());

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

/** A photo between lines: its width in % of the text, centered, keeping its shape while it loads */
function ArticleImage({ image }: { image: RichImage }) {
  const url = useContext(ImageUrls).get(image.attrs.imageId);
  if (!url) return null; // its file was deleted
  return (
    <Image
      source={{ uri: url }}
      contentFit="cover"
      transition={150}
      accessibilityLabel={image.attrs.alt || undefined}
      accessible={!!image.attrs.alt}
      style={[styles.image, { width: `${image.attrs.width}%`, aspectRatio: image.attrs.ratio ?? 1.5 }]}
    />
  );
}

function Block({ block }: { block: RichBlock }) {
  switch (block.type) {
    case 'image':
      return <ArticleImage image={block} />;
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

/** Empty paragraphs at the end (the editor keeps one after a final image so you can type there) */
function withoutTrailingEmpty(blocks: RichBlock[]) {
  let end = blocks.length;
  while (end > 0 && blocks[end - 1].type === 'paragraph' && !(blocks[end - 1] as { content?: unknown[] }).content?.length) end--;
  return blocks.slice(0, end);
}

/** An article's formatted text; `images` gives the URLs of the photos placed in it */
export function RichText({ doc, images = [] }: { doc: RichDoc; images?: ImageRef[] }) {
  return (
    <ImageUrls.Provider value={new Map(images.map((i) => [i.id, i.url]))}>
      <Blocks blocks={withoutTrailingEmpty(doc.content)} />
    </ImageUrls.Provider>
  );
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
  image: {
    alignSelf: 'center',
    marginVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  rule: {
    height: 2,
    marginVertical: space.sm,
    backgroundColor: colors.border,
  },
});
