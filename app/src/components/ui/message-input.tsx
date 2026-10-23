import { useState, type ReactNode, type Ref } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from 'react-native';

import { SEND_BUTTON_HEIGHT, SendButton } from '@/components/ui/send-button';
import { goToSignIn, useSignedInId } from '@/lib/sign-in-gate';
import { alpha, colors, fontFamily, fontSize, formGray, radius, space } from '@/theme';

const LINE = 22;
const MAX_LINES = 5;

type MessageInputProps = {
  /** e.g. "Γράψε σχόλιο..." (also read by screen readers) */
  placeholder: string;
  /** Gets the trimmed text. With the field's own text it also empties it and goes to the sign-in page when signed out */
  onSend: (text: string) => void;
  /** Opens the keyboard right away (e.g. after tapping "Απάντηση") */
  autoFocus?: boolean;
  /** The text, when the screen keeps it (then the field never empties itself and sending is the screen's business) */
  value?: string;
  onChangeText?: (text: string) => void;
  /** The field's own colour instead of the card cream (e.g. the posts' warm paper) */
  fieldColor?: string;
  /** The field starts this many lines tall (a roomy field to write in) */
  minLines?: number;
  maxLines?: number;
  maxLength?: number;
  /** Inside the box, over the text: e.g. a title field */
  above?: ReactNode;
  /** Inside the box, under the text: e.g. the photo and plant buttons */
  below?: ReactNode;
  /** Instead of the standard send button (e.g. the one whose plane flies away); it decides what pressing does */
  sendButton?: ReactNode;
  /** Sending is possible even with no text (e.g. only photos); by default it needs some */
  canSend?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** The text's area, for a screen that animates things out of it */
  textAreaRef?: Ref<View>;
  inputRef?: Ref<TextInput>;
  style?: StyleProp<ViewStyle>;
};

/**
 * THE message field of the app (replies, comments, posts and questions): the text wraps onto new lines and the
 * field grows up to `maxLines`, then scrolls; the send button stays at the bottom right, next to the last line.
 * Focused, it gets a gray border. On web, Enter sends and Shift+Enter starts a new line. Screens that need more
 * give it slots: `above` and `below` inside its box, their own `value`, `sendButton` and `fieldColor`.
 */
export function MessageInput({
  placeholder,
  onSend,
  autoFocus,
  value,
  onChangeText,
  fieldColor,
  minLines = 1,
  maxLines = MAX_LINES,
  maxLength,
  above,
  below,
  sendButton,
  canSend: canSendOverride,
  onFocus,
  onBlur,
  textAreaRef,
  inputRef,
  style,
}: MessageInputProps) {
  const controlled = value !== undefined;
  const [own, setOwn] = useState('');
  const text = controlled ? value : own;
  const [height, setHeight] = useState(LINE);
  const [focused, setFocused] = useState(false);
  const canSend = canSendOverride ?? text.trim().length > 0;
  const signedIn = useSignedInId() !== null;

  const change = (next: string) => {
    if (!controlled) setOwn(next);
    onChangeText?.(next);
  };

  // Its own text, signed out: the sign-in page first (a screen that keeps the text does that itself)
  const send = () => {
    if (controlled) {
      onSend(text.trim());
      return;
    }
    if (!canSend) return;
    if (!signedIn) {
      goToSignIn();
      return;
    }
    onSend(text.trim());
    setOwn('');
    setHeight(LINE);
  };
  const shownHeight = Math.max(height, LINE * minLines);

  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData & { shiftKey?: boolean }>) => {
    if (Platform.OS !== 'web' || event.nativeEvent.key !== 'Enter' || event.nativeEvent.shiftKey) return;
    event.preventDefault();
    send();
  };

  return (
    <View style={[styles.box, focused && styles.focused, fieldColor !== undefined && { backgroundColor: fieldColor }, style]}>
      {above}
      <View style={styles.row}>
        <View ref={textAreaRef} collapsable={false} style={styles.textArea}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={change}
            onKeyPress={onKeyPress}
            onFocus={() => {
              setFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            onContentSizeChange={(event) =>
              setHeight(Math.min(LINE * maxLines, Math.max(LINE, event.nativeEvent.contentSize.height)))
            }
            multiline
            scrollEnabled={shownHeight >= LINE * maxLines}
            placeholder={placeholder}
            placeholderTextColor={colors.inkMuted}
            autoFocus={autoFocus}
            maxLength={maxLength}
            accessibilityLabel={placeholder}
            textAlignVertical="top"
            style={[styles.input, { height: shownHeight }]}
          />
        </View>
        {sendButton ?? <SendButton onPress={send} disabled={!canSend} />}
      </View>
      {below}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    // The corners of the send button inside it
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingVertical: space.xs,
    gap: space.xs,
  },
  focused: {
    borderColor: alpha(formGray, 0.5),
  },
  // The button follows the last line
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
  },
  textArea: {
    flex: 1,
    minWidth: 0,
  },
  input: {
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
