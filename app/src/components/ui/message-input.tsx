import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, fontFamily, fontSize, iconSize, radius, size, space } from '@/theme';

const SEND = size.touch - space.sm;

type MessageInputProps = {
  /** e.g. "Γράψε σχόλιο..." (also read by screen readers) */
  placeholder: string;
  onSend: (text: string) => void;
  /** Opens the keyboard right away (e.g. after tapping "Απάντηση") */
  autoFocus?: boolean;
};

/** A rounded text field with a round send button inside it (comments, replies, posts) */
export function MessageInput({ placeholder, onSend, autoFocus }: MessageInputProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.field}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        returnKeyType="send"
        autoFocus={autoFocus}
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Αποστολή"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={send}
        style={[styles.send, !canSend && styles.sendDisabled]}>
        <Icon name="send" size={iconSize.normal} color={colors.surface} bold />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: size.touch,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: space.md,
    paddingRight: space.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
  },
  send: {
    width: SEND,
    height: SEND,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
