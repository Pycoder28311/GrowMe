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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Hides the splash screen only once we know whether the user is signed in */}
      {!isPending && <AnimatedSplashOverlay />}
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
