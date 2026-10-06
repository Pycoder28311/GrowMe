import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';

import { MessageInput } from '@/components/ui/message-input';
import { alpha, colors, space } from '@/theme';

type BottomComposerProps = {
  placeholder: string;
  onSend: (text: string) => void;
};

/**
 * A message field pinned to the bottom of a page. When the keyboard opens it moves up just enough
 * to stay above it (measured, so it also works where the system already resizes the screen).
 */
export function BottomComposer({ placeholder, onSend }: BottomComposerProps) {
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
    <View ref={ref} collapsable={false} style={[styles.bar, { marginBottom: lift }]}>
      <MessageInput placeholder={placeholder} onSend={onSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: alpha(colors.surface, 0.9),
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
