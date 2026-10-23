import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { card } from '@/components/ui/styles';
import { botanical, colors, iconSize, radius, space } from '@/theme';

const MENU_WIDTH = 190;
const BUTTON = 32;

type PostMenuProps = {
  onEdit?: () => void;
  onDelete?: () => void;
};

/**
 * The author's three dots at a post's top right: they open a small dropdown with «Επεξεργασία» and «Διαγραφή» (which
 * asks once more before it deletes), right under the dots.
 */
export function PostMenu({ onEdit, onDelete }: PostMenuProps) {
  const button = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const [sure, setSure] = useState(false);

  const open = () =>
    button.current?.measureInWindow((x, y, width, height) => {
      setSure(false);
      setAt({ top: y + height + space.xs, left: Math.min(Math.max(space.sm, x + width - MENU_WIDTH), screenWidth - MENU_WIDTH - space.sm) });
    });
  const close = () => setAt(null);
  const choose = (action?: () => void) => {
    close();
    action?.();
  };

  return (
    <>
      <Pressable ref={button} accessibilityRole="button" accessibilityLabel="Επιλογές ανάρτησης" onPress={open} hitSlop={space.xs} style={styles.dots}>
        <Icon name="more" size={iconSize.big} color={colors.inkMuted} bold />
      </Pressable>
      <Modal transparent visible={!!at} animationType="fade" onRequestClose={close}>
        <Pressable accessibilityLabel="Κλείσιμο" style={StyleSheet.absoluteFill} onPress={close} />
        {at && (
          <View style={[styles.menu, at]}>
            {onEdit && (
              <Pressable accessibilityRole="button" onPress={() => choose(onEdit)} style={styles.item}>
                <Icon name="edit" size={iconSize.small} color={colors.primary} bold />
                <AppText bold color={colors.primary}>
                  Επεξεργασία
                </AppText>
              </Pressable>
            )}
            {onDelete && (
              <Pressable accessibilityRole="button" onPress={() => (sure ? choose(onDelete) : setSure(true))} style={styles.item}>
                <Icon name="trash" size={iconSize.small} color={colors.danger} bold />
                <AppText bold color={colors.danger}>
                  {sure ? 'Σίγουρα; Διαγραφή' : 'Διαγραφή'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dots: {
    width: BUTTON,
    height: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  menu: {
    ...card,
    position: 'absolute',
    width: MENU_WIDTH,
    padding: space.xs,
    backgroundColor: botanical.cream,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
});
