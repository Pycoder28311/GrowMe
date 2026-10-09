import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from 'react-native';

import { SEND_BUTTON_HEIGHT, SendButton } from '@/components/ui/send-button';
import { alpha, colors, fontFamily, fontSize, formGray, radius, space } from '@/theme';

const LINE = 22;
const MAX_LINES = 5;

type MessageInputProps = {
  /** e.g. "Γράψε σχόλιο..." (also read by screen readers) */
  placeholder: string;
  onSend: (text: string) => void;
  /** Opens the keyboard right away (e.g. after tapping "Απάντηση") */
  autoFocus?: boolean;
};

/**
 * A message field (comments, replies, posts): the text wraps onto new lines and the field grows up
 * to 5 lines, then scrolls; «Αποστολή ›» stays at the bottom right, next to the last line. Focused, it
 * gets a gray border (no orange outline). On web, Enter sends and Shift+Enter starts a new line.
 */
export function MessageInput({ placeholder, onSend, autoFocus }: MessageInputProps) {
  const [text, setText] = useState('');
  const [height, setHeight] = useState(LINE);
  const [focused, setFocused] = useState(false);
  const canSend = text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    setHeight(LINE);
  };

  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData & { shiftKey?: boolean }>) => {
    if (Platform.OS !== 'web' || event.nativeEvent.key !== 'Enter' || event.nativeEvent.shiftKey) return;
    event.preventDefault();
    send();
  };

  return (
    <View style={[styles.field, focused && styles.focused]}>
      <TextInput
        value={text}
        onChangeText={setText}
        onKeyPress={onKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onContentSizeChange={(event) =>
          setHeight(Math.min(LINE * MAX_LINES, Math.max(LINE, event.nativeEvent.contentSize.height)))
        }
        multiline
        scrollEnabled={height >= LINE * MAX_LINES}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        autoFocus={autoFocus}
        accessibilityLabel={placeholder}
        textAlignVertical="top"
        style={[styles.input, { height }]}
      />
      <SendButton onPress={send} disabled={!canSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  // The button follows the last line
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingVertical: space.xs,
  },
  focused: {
    borderColor: alpha(formGray, 0.5),
  },
  input: {
    flex: 1,
    // A single line sits level with the button's middle; more lines grow upwards
    marginVertical: (SEND_BUTTON_HEIGHT - LINE) / 2,
    padding: 0,
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    lineHeight: LINE,
    color: colors.ink,
    // No browser focus ring (the field's border shows the focus)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
