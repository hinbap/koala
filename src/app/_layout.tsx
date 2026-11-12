import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppStoreProvider } from '@/state/AppStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useAppFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync().catch(console.warn);

export const unstable_settings = { initialRouteName: 'index' };

function AppNavigator() {
  const theme = useTheme();
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={{
      ...base,
      colors: { ...base.colors, background: theme.paper, card: theme.paper, text: theme.ink, primary: theme.accent, border: theme.line },
    }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.root, { backgroundColor: theme.paper }]}>
        <View style={styles.app}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.paper }, animation: 'fade' }}>
            <Stack.Screen name="index" options={{ title: 'Alarms' }} />
            <Stack.Screen name="puzzle" options={{ title: 'Sudoku' }} />
            <Stack.Screen name="excuse" options={{ title: 'Excuses' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="wakeups" options={{ title: 'Wake-ups' }} />
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
      <AppStoreProvider>
        <AppNavigator />
      </AppStoreProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 600 },
});
