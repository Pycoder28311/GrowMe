import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { Checkbox } from '@/components/ui/checkbox';
import { card } from '@/components/ui/styles';
import { colors, fontFamily, fontSize, size, space } from '@/theme';

/** "Ask us anything": a question box with an image option. Not sent anywhere yet: it only thanks the user. */
export function AskCard() {
  const [question, setQuestion] = useState('');
  const [withImage, setWithImage] = useState(false);
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!question.trim()) return;
    setQuestion('');
    setWithImage(false);
    setSent(true);
  };

  return (
    <View style={styles.root}>
      <AppText size="big" bold accessibilityRole="header" style={styles.title}>
        Ρώτησέ μας ό,τι θες!
      </AppText>

      <View style={styles.card}>
        <TextInput
          value={question}
          onChangeText={(text) => {
            setQuestion(text);
            setSent(false);
          }}
          placeholder="Η ερώτησή σου..."
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Η ερώτησή σου"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
        <View style={styles.footer}>
          <Checkbox label="Εικόνα" checked={withImage} onToggle={() => setWithImage((v) => !v)} />
          <ActionButton size="md" edge={false} glow="soft" onPress={send}>
            <ActionButtonText>Αποστολή</ActionButtonText>
          </ActionButton>
        </View>
        {sent && (
          <AppText size="small" color={colors.primary} accessibilityLiveRegion="polite">
            Ευχαριστούμε! Θα σου απαντήσουμε σύντομα.
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  title: {
    textAlign: 'center',
    // White glow keeps it readable over the background photo
    textShadowColor: colors.surface,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  card: {
    ...card,
    gap: space.sm,
    padding: space.md,
  },
  input: {
    minHeight: size.touch * 1.5,
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
});
