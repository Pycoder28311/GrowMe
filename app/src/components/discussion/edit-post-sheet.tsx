import type { Post } from '@growme/shared';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { postsApi } from '@/api/posts';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { TextField } from '@/components/ui/text-field';
import { colors, space } from '@/theme';

/**
 * The author's way to change their post: its title and text in a sheet from the bottom. «Αποθήκευση» sends only
 * what changed; `onSaved` gets the post as the server now has it (the screen swaps it in).
 */
export function EditPostSheet({ post, onSaved, onClose }: { post: Post; onSaved: (post: Post) => void; onClose: () => void }) {
  const sheet = useRef<BottomSheetHandle>(null);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = title.trim() !== post.title || content.trim() !== post.content;
  const valid = title.trim().length > 0 && content.trim().length > 0;

  const save = async () => {
    if (saving || !changed || !valid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await postsApi.update(post.id, {
        ...(title.trim() !== post.title && { title: title.trim() }),
        ...(content.trim() !== post.content && { content: content.trim() }),
      });
      onSaved(updated);
      sheet.current?.close();
    } catch {
      setError('Η ανάρτηση δεν αποθηκεύτηκε. Δοκίμασε ξανά.');
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={sheet}
      title="Επεξεργασία ανάρτησης"
      initialSnap="full"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <ActionButton size="md" color="green" edge={false} glow="soft" onPress={save}>
            <ActionButtonText>{saving ? 'Αποθήκευση…' : 'Αποθήκευση'}</ActionButtonText>
          </ActionButton>
        </View>
      }>
      <View style={styles.form}>
        <TextField label="Τίτλος" value={title} onChangeText={setTitle} maxLength={200} />
        <TextField label="Κείμενο" value={content} onChangeText={setContent} maxLength={10000} multiline textAlignVertical="top" style={styles.content} />
        {error && (
          <AppText size="small" color={colors.accent} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.md,
    padding: space.md,
  },
  content: {
    minHeight: 160,
  },
  footer: {
    padding: space.md,
  },
});
