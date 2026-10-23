import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';

import { MessageInput } from '@/components/ui/message-input';
import { alpha, colors, space } from '@/theme';

/**
 * Something pinned to the bottom of a page (a message field, the post form). When the keyboard opens
 * it moves up just enough to stay above it (measured, so it also works where the system already
 * resizes the screen).
 */
export function BottomBar({
  children,
  floating,
  onHeight,
}: {
  children: ReactNode;
  /** Over the page's content (which scrolls behind it), with no line or background of its own */
  floating?: boolean;
  /** Its height as it changes (a floating bar leaves room for it under the content) */
  onHeight?: (height: number) => void;
}) {
  const ref = useRef<View>(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      const keyboardTop = event.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _width, height) => setLift(Math.max(0, y + height - keyboardTop)));
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={onHeight ? (event) => onHeight(event.nativeEvent.layout.height) : undefined}
      style={[styles.bar, floating && styles.floating, { marginBottom: lift }]}>
      {children}
    </View>
  );
}

type BottomComposerProps = {
  placeholder: string;
  onSend: (text: string) => void;
  /** The cursor is in the field as the page opens */
  autoFocus?: boolean;
};

/** A message field pinned to the bottom of a page (replies) */
export function BottomComposer({ placeholder, onSend, autoFocus }: BottomComposerProps) {
  return (
    <BottomBar>
      <MessageInput placeholder={placeholder} onSend={onSend} autoFocus={autoFocus} />
    </BottomBar>
  );
}

const styles = StyleSheet.create({
  // No line or background: what is in it floats over the page's content
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: alpha(colors.surface, 0.9),
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
