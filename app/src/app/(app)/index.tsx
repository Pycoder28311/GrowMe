import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notesApi, type DraftImage, type Note } from '@/api/notes';
import { Button } from '@/components/button';
import { ImageCarousel } from '@/components/image-carousel';
import { NoteEditor } from '@/components/note-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { authClient } from '@/lib/auth-client';
import { openCookieSettings } from '@/lib/consent';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createKey, setCreateKey] = useState(0);

  useEffect(() => {
    notesApi
      .list()
      .then(setNotes)
      .catch(() => setError('Could not load notes'))
      .finally(() => setLoading(false));
  }, []);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  const createNote = (text: string, images: DraftImage[]) =>
    run(async () => {
      const note = await notesApi.save(null, text, images);
      setNotes((current) => [note, ...current]);
      setCreateKey((k) => k + 1); // resets the create form
      track('note_created', { images: images.length });
    });

  const updateNote = (id: number, text: string, images: DraftImage[]) =>
    run(async () => {
      const updated = await notesApi.save(id, text, images);
      setNotes((current) => current.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
      track('note_updated', { images: images.length });
    });

  const deleteNote = (id: number) =>
    run(async () => {
      await notesApi.remove(id);
      setNotes((current) => current.filter((n) => n.id !== id));
      track('note_deleted', { id });
    });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(note) => String(note.id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <ThemedText type="subtitle">Notes</ThemedText>
                  <Button label="Sign out" onPress={() => authClient.signOut()} destructive />
                  {Platform.OS === 'web' && <Button label="Cookie settings" onPress={openCookieSettings} />}
                </View>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <NoteEditor key={createKey} onSave={createNote} />
                </ThemedView>
                {error && <ThemedText style={styles.error}>{error}</ThemedText>}
              </View>
            }
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary">No notes yet. Add your first one.</ThemedText>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.card}>
                {editingId === item.id ? (
                  <NoteEditor
                    note={item}
                    onSave={(text, images) => updateNote(item.id, text, images)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <ImageCarousel images={item.images} />
                    <ThemedText>{item.text}</ThemedText>
                    <View style={styles.actions}>
                      <Button label="Edit" onPress={() => setEditingId(item.id)} />
                      <Button label="Delete" onPress={() => deleteNote(item.id)} destructive />
                    </View>
                  </>
                )}
              </ThemedView>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset,
  },
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  error: {
    color: '#e5484d',
  },
  loader: {
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
});
