import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notesApi, type Note } from '@/api/notes';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotesScreen() {
  const theme = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

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

  const addNote = () =>
    run(async () => {
      const text = newText.trim();
      if (!text) return;
      const note = await notesApi.create(text);
      setNotes((current) => [note, ...current]);
      setNewText('');
    });

  const saveEdit = (id: number) =>
    run(async () => {
      const text = editText.trim();
      if (!text) return;
      const updated = await notesApi.update(id, text);
      setNotes((current) => current.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
    });

  const deleteNote = (id: number) =>
    run(async () => {
      await notesApi.remove(id);
      setNotes((current) => current.filter((n) => n.id !== id));
    });

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Notes</ThemedText>

        <View style={styles.row}>
          <TextInput
            style={[inputStyle, styles.flex]}
            placeholder="Write a note..."
            placeholderTextColor={theme.textSecondary}
            value={newText}
            onChangeText={setNewText}
            onSubmitEditing={addNote}
            returnKeyType="done"
          />
          <Button label="Add" onPress={addNote} />
        </View>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(note) => String(note.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary">No notes yet. Add your first one.</ThemedText>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.note}>
                {editingId === item.id ? (
                  <>
                    <TextInput
                      style={[inputStyle, { backgroundColor: theme.background }]}
                      value={editText}
                      onChangeText={setEditText}
                      autoFocus
                    />
                    <View style={styles.actions}>
                      <Button label="Save" onPress={() => saveEdit(item.id)} />
                      <Button label="Cancel" onPress={() => setEditingId(null)} />
                    </View>
                  </>
                ) : (
                  <>
                    <ThemedText>{item.text}</ThemedText>
                    <View style={styles.actions}>
                      <Button label="Edit" onPress={() => startEdit(item)} />
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

function Button({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: destructive ? '#e5484d' : '#3c87f7' }}>
        {label}
      </ThemedText>
    </Pressable>
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
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  error: {
    color: '#e5484d',
  },
  loader: {
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  note: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.5,
  },
});
