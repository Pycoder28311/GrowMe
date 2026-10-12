import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** The Facebook mark: a blue disc with a white «f» */
export function FacebookIcon({ size = 28 }: { size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill="#1877f2" />
      <Path d="M13.4 21v-7.6h2.6l.4-3h-3V8.7c0-.9.3-1.4 1.5-1.4h1.6V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2H8v3h2.4V21h3z" fill="#ffffff" />
    </Svg>
    </View>
  );
}

/** The Instagram mark: a rounded square in the brand's gradient with a white camera outline */
export function InstagramIcon({ size = 28 }: { size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="instagram-fill" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#feda75" />
          <Stop offset="0.3" stopColor="#fa7e1e" />
          <Stop offset="0.55" stopColor="#d62976" />
          <Stop offset="0.8" stopColor="#962fbf" />
          <Stop offset="1" stopColor="#4f5bd5" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={24} height={24} rx={6.5} fill="url(#instagram-fill)" />
      <Rect x={5} y={5} width={14} height={14} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.7} />
      <Circle cx={12} cy={12} r={3.3} fill="none" stroke="#ffffff" strokeWidth={1.7} />
      <Circle cx={16.2} cy={7.8} r={1} fill="#ffffff" />
    </Svg>
    </View>
  );
}
