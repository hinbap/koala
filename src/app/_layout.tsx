import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { routeAccess } from '@/lib/auth';
import { AuthProvider, useAuth } from '@/state/AuthProvider';
import { AppStoreProvider, useStore } from '@/state/AppStore';
import { AlarmNotificationsProvider } from '@/state/AlarmNotifications';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useAppFonts } from '@/theme/fonts';
import { useAlarmSound } from '@/hooks/useAlarmSound';

void SplashScreen.preventAutoHideAsync().catch(console.warn);

export const unstable_settings = { initialRouteName: 'index' };

const noSubscribe = () => () => {};

/** Mounted after the first client render: expo-audio's web player needs the browser `Audio` global. */
function AlarmSound() {
  useAlarmSound();
  return null;
}

function AppNavigator() {
  const theme = useTheme();
  const auth = useAuth();
  const { ringing } = useStore();
  const access = routeAccess(auth.welcomeCompleted, auth.hasAccess, !!ringing);
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);

  if (!auth.ready) return null;

  return (
    <NavigationThemeProvider value={{
      ...base,
      colors: { ...base.colors, background: theme.paper, card: theme.paper, text: theme.ink, primary: theme.accent, border: theme.line },
    }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {mounted && <AlarmSound />}
      <View style={[styles.root, { backgroundColor: theme.paper }]}>
        <View style={styles.app}>
          <Stack screenOptions={{ headerShown: false, gestureEnabled: false, contentStyle: { backgroundColor: theme.paper }, animation: 'fade' }}>
            <Stack.Protected guard={access.welcome}>
              <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
            </Stack.Protected>
            <Stack.Protected guard={access.signIn}>
              <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
            </Stack.Protected>
            <Stack.Protected guard={access.app}>
              <Stack.Screen name="index" options={{ title: 'Alarms' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="wakeups" options={{ title: 'Wake-ups' }} />
            </Stack.Protected>
            <Stack.Protected guard={access.puzzle}>
              <Stack.Screen name="puzzle" options={{ title: 'Sudoku' }} />
              <Stack.Screen name="excuse" options={{ title: 'Excuses' }} />
            </Stack.Protected>
          </Stack>
        </View>
      </View>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) SplashScreen.hide();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStoreProvider>
          <AlarmNotificationsProvider>
            <AppNavigator />
          </AlarmNotificationsProvider>
        </AppStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 600 },
});
