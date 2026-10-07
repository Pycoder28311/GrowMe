import { parseRichContent, plainTextOf, type Blog } from '@growme/shared';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { blogsApi } from '@/api/blogs';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { PillButton } from '@/components/ui/pill-button';
import { colors, space } from '@/theme';

const SNIPPET = 160;

// Blogs already opened in a panel (this session): a second tap shows at once
const cache = new Map<number, Blog>();

const BlogPreviewContext = createContext<(blogId: number) => void>(() => {});

/** Opens the panel of a blog linked in a text (see LinkedText) */
export const useBlogPreview = () => useContext(BlogPreviewContext);

/** The start of an article's text, cut at a word, with «…» */
function snippetOf(blog: Blog) {
  const text = plainTextOf(parseRichContent(blog.content)).replace(/\s+/g, ' ').trim();
  if (text.length <= SNIPPET) return text;
  const cut = text.slice(0, SNIPPET);
  return `${cut.slice(0, cut.lastIndexOf(' ') > SNIPPET / 2 ? cut.lastIndexOf(' ') : SNIPPET).trimEnd()}…`;
}

type State = { blog: Blog } | { error: 'gone' | 'failed' } | null;

/** The panel: title, the start of the text and «Δες περισσότερα» (loads the blog when it opens) */
function BlogPreviewSheet({ blogId, onClose }: { blogId: number; onClose: () => void }) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const openAfterClose = useRef(false);
  const [state, setState] = useState<State>(() => (cache.has(blogId) ? { blog: cache.get(blogId)! } : null));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache.has(blogId)) return;
    let live = true;
    blogsApi
      .get(blogId)
      .then((blog) => {
        cache.set(blogId, blog);
        if (live) setState({ blog });
      })
      .catch((err: unknown) => {
        if (live) setState({ error: String(err).includes('(404)') ? 'gone' : 'failed' });
      });
    return () => {
      live = false;
    };
  }, [blogId, attempt]);

  const blog = state && 'blog' in state ? state.blog : null;

  return (
    <BottomSheet
      ref={sheetRef}
      title={blog?.name ?? 'Άρθρο'}
      initialSnap="half"
      onClose={() => {
        onClose();
        if (openAfterClose.current) router.push({ pathname: '/wiki/[id]', params: { id: String(blogId) } });
      }}
      footer={
        blog ? (
          <ActionButton
            edge={false}
            glow="soft"
            onPress={() => {
              openAfterClose.current = true;
              sheetRef.current?.close();
            }}>
            <ActionButtonText>Δες περισσότερα</ActionButtonText>
          </ActionButton>
        ) : undefined
      }>
      {blog ? (
        <AppText>{snippetOf(blog)}</AppText>
      ) : state && 'error' in state ? (
        <View style={styles.status}>
          <AppText color={colors.inkMuted}>
            {state.error === 'gone'
              ? 'Το άρθρο δεν είναι πια διαθέσιμο.'
              : 'Δεν ήταν δυνατή η φόρτωση του άρθρου.'}
          </AppText>
          {state.error === 'failed' && (
            <PillButton
              label="Δοκίμασε ξανά"
              onPress={() => {
                setState(null);
                setAttempt((n) => n + 1);
              }}
            />
          )}
        </View>
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.status} />
      )}
    </BottomSheet>
  );
}

/** Holds the one blog panel of the signed-in pages; texts open it through useBlogPreview() */
export function BlogPreviewProvider({ children }: { children: ReactNode }) {
  const [blogId, setBlogId] = useState<number | null>(null);
  return (
    <BlogPreviewContext.Provider value={setBlogId}>
      {children}
      {blogId !== null && <BlogPreviewSheet key={blogId} blogId={blogId} onClose={() => setBlogId(null)} />}
    </BlogPreviewContext.Provider>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
  },
});
