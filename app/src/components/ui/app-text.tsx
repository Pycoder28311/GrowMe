import { Text, type TextProps } from 'react-native';

import { colors, fontFamily, fontSize, type FontSize } from '@/theme';

type AppTextProps = TextProps & {
  size?: FontSize;
  bold?: boolean;
  color?: string;
};

/** Text in the app font (Source Sans 3) with a theme size; every new screen uses this instead of Text */
export function AppText({ size = 'normal', bold, color = colors.ink, style, ...props }: AppTextProps) {
  return (
    <Text
      style={[
        { fontFamily: bold ? fontFamily.bold : fontFamily.normal, fontSize: fontSize[size], color },
        style,
      ]}
      {...props}
    />
  );
}
