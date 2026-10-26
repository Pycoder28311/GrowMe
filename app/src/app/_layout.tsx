import { SourceSans3_400Regular, SourceSans3_700Bold, useFonts } from '@expo-google-fonts/source-sans-3';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnalyticsGate } from '@/components/analytics-gate';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CookieBanner } from '@/components/cookie-banner';
import { authClient } from '@/lib/auth-client';

SplashScreen.preventAutoHideAsync();

/** The longest the splash screen waits for the sign-in check (a slow network must not hold the app closed) */
const SESSION_WAIT_MS = 1000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { data: session, isPending } = authClient.useSession();
  // The app font (see @/theme fontFamily); on a load error the app still opens with the system font
  const [fontsLoaded, fontError] = useFonts({ SourceSans3_400Regular, SourceSans3_700Bold });
  const [sessionWaitOver, setSessionWaitOver] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSessionWaitOver(true), SESSION_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Hides the splash screen once the font is ready and we know whether the user is signed in (or after
          SESSION_WAIT_MS: the pages update when the answer comes) */}
      {(!isPending || sessionWaitOver) && (fontsLoaded || fontError) && <AnimatedSplashOverlay />}
      {/* Always rendered, so a link like growme://reset-password?token=… is never lost */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Open to everyone: the profile and writing ask for an account when used (lib/sign-in-gate) */}
        <Stack.Screen name="(app)" />
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
