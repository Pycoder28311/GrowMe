import { SourceSans3_400Regular, SourceSans3_700Bold, useFonts } from '@expo-google-fonts/source-sans-3';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnalyticsGate } from '@/components/analytics-gate';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CookieBanner } from '@/components/cookie-banner';
import { authClient } from '@/lib/auth-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { data: session, isPending } = authClient.useSession();
  // The app font (see @/theme fontFamily); on a load error the app still opens with the system font
  const [fontsLoaded, fontError] = useFonts({ SourceSans3_400Regular, SourceSans3_700Bold });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Hides the splash screen only once we know whether the user is signed in and the font is ready */}
      {!isPending && (fontsLoaded || fontError) && <AnimatedSplashOverlay />}
      {/* Always rendered, so a link like growme://reset-password?token=… is never lost */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
        {/* Outside both guards: the email link must open even if you're signed in on this device */}
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="privacy" />
      </Stack>
      <CookieBanner />
      <AnalyticsGate />
    </ThemeProvider>
  );
}
