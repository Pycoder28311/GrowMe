import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { DraftImage, Note } from '@/api/notes';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAX_IMAGES = 10;
const THUMB = 72;

type NoteEditorProps = {
  note?: Note;
  onSave: (text: string, images: DraftImage[]) => Promise<void>;
  onCancel?: () => void;
};

async function pickImages(limit: number) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map((asset): DraftImage => ({ url: asset.uri, asset }));
}

/** Text + image strip: add (+), replace (tap) or remove (×) images, then save */
export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const theme = useTheme();
  const [text, setText] = useState(note?.text ?? '');
  const [images, setImages] = useState<DraftImage[]>(note?.images ?? []);
  const [saving, setSaving] = useState(false);

  const addImages = async () => {
    const picked = await pickImages(MAX_IMAGES - images.length);
    setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
  };

  const replaceImage = async (index: number) => {
    const [picked] = await pickImages(1);
    if (picked) setImages((current) => current.map((img, i) => (i === index ? picked : img)));
  };

  const removeImage = (index: number) =>
    setImages((current) => current.filter((_, i) => i !== index));

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(text.trim(), images);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        placeholder="Write a note..."
        placeholderTextColor={theme.textSecondary}
        value={text}
        onChangeText={setText}
        multiline
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {images.map((image, index) => (
          <Pressable key={image.id ?? image.url} onPress={() => replaceImage(index)}>
            <Image source={{ uri: image.url }} style={styles.thumb} contentFit="cover" />
            <Pressable onPress={() => removeImage(index)} style={styles.remove} hitSlop={8}>
              <ThemedText type="smallBold" style={styles.removeText}>
                ×
              </ThemedText>
            </Pressable>
          </Pressable>
        ))}
        {images.length < MAX_IMAGES && (
          <Pressable
            onPress={addImages}
            style={[styles.thumb, styles.add, { borderColor: theme.textSecondary }]}>
            <ThemedText themeColor="textSecondary" style={styles.addText}>
              +
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {onCancel && <Button label="Cancel" onPress={onCancel} disabled={saving} />}
        <Button label={saving ? 'Saving...' : 'Save'} onPress={save} disabled={saving || !text.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  strip: {
    gap: Spacing.two,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Spacing.two,
  },
  add: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 28,
    lineHeight: 32,
  },
  remove: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e5484d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#ffffff',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
});
