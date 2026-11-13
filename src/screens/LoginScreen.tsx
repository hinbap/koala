import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../state/AuthProvider';
import { AuthMode, isEmail, validateCredentials } from '../lib/auth';
import { ThemedText } from '../components/ui/ThemedText';
import { TextField, TextFieldRef } from '../components/ui/TextField';
import { SleepingKoala } from '../components/SleepingKoala';

const COPY: Record<AuthMode, { title: string; lede: string; submit: string; prompt: string; switchTo: string }> = {
  signin: {
    title: 'Sign in',
    lede: 'Your alarms are waiting. So is the puzzle.',
    submit: 'Sign in',
    prompt: 'New here?',
    switchTo: 'Create an account',
  },
  signup: {
    title: 'Create account',
    lede: 'Create your account. Alarms and profile stay on this device.',
    submit: 'Create account',
    prompt: 'Have an account?',
    switchTo: 'Sign in',
  },
};

export function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, requestPasswordReset, continueAsGuest, configured, storageError } = useAuth();
  const inFlight = useRef(false);
  const passwordRef = useRef<TextFieldRef>(null);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [note, setNote] = useState('');

  const copy = COPY[mode];
  const problem = tried ? validateCredentials(mode, email, password) : null;
  const error = problem?.message ?? serverError;

  const submit = async () => {
    setTried(true);
    setNote('');
    if (validateCredentials(mode, email, password) || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setServerError('');
    try {
      await signIn(mode, email, password);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Couldn’t sign in. Try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (inFlight.current) return;
    setTried(false);
    if (!isEmail(email)) {
      setNote('');
      setServerError('Enter your email first, then tap Forgot password.');
      return;
    }
    setServerError('');
    inFlight.current = true;
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setNote('If this email has an account, a reset link is on its way.');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Couldn’t send a reset email. Try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setPassword('');
    setShowPassword(false);
    setTried(false);
    setServerError('');
    setNote('');
  };

  const clear = () => {
    setServerError('');
    setNote('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.head}>
          <View style={styles.koala}>
            <SleepingKoala />
          </View>
          <ThemedText caption tone="muted">Sudoku Alarm</ThemedText>
          <ThemedText face="display" size={40} lineHeight={48} accessibilityRole="header">
            {copy.title}
          </ThemedText>
          <ThemedText tone="muted" lineHeight={24}>{copy.lede}</ThemedText>
        </View>

        <View style={styles.form}>
          {!configured && <ThemedText size={14} tone="muted">Account sign-in isn’t configured in this build. Continue as a guest to use alarms on this device.</ThemedText>}
          {storageError && <ThemedText tone="alarm" accessibilityRole="alert">{storageError}</ThemedText>}
          <TextField
            label="Email"
            editable={!busy}
            value={email}
            onChangeText={(v) => { setEmail(v); clear(); }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            invalid={problem?.field === 'email'}
          />
          <TextField
            ref={passwordRef}
            label="Password"
            editable={!busy}
            value={password}
            onChangeText={(v) => { setPassword(v); clear(); }}
            placeholder={mode === 'signup' ? 'At least 8 characters' : 'Password'}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
            invalid={problem?.field === 'password'}
            trailing={
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={styles.reveal}
              >
                <ThemedText size={14} weight={500} tone="muted">{showPassword ? 'Hide' : 'Show'}</ThemedText>
              </Pressable>
            }
          />

          {error ? (
            <ThemedText size={14} lineHeight={20} tone="alarm" accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : note ? (
            <ThemedText size={14} lineHeight={20} tone="muted" accessibilityLiveRegion="polite">{note}</ThemedText>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy || !configured}
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy || !configured }}
            style={({ pressed }) => [styles.submit, { backgroundColor: t.accent, borderRadius: t.def.radius, opacity: !configured ? 0.45 : pressed || busy ? 0.85 : 1 }]}
          >
            {busy ? <ActivityIndicator color={t.onAccent} /> : <ThemedText weight={600} tone="onAccent">{copy.submit}</ThemedText>}
          </Pressable>

          {mode === 'signin' && (
            <Pressable onPress={forgot} disabled={busy || !configured} accessibilityRole="button" style={styles.link}>
              <ThemedText size={14} weight={500} tone="accent">Forgot password?</ThemedText>
            </Pressable>
          )}
        </View>

        <Pressable onPress={continueAsGuest} disabled={busy} accessibilityRole="button" style={[styles.link, { marginTop: 20 }]}><ThemedText tone="accent">Continue as guest</ThemedText></Pressable>
        <ThemedText size={12} tone="muted" style={{ textAlign: 'center' }}>Alarms and profile data are stored on this device, not synced to your account.</ThemedText>
        <View style={styles.switchRow}>
          <ThemedText size={14} tone="muted">{copy.prompt}</ThemedText>
          <Pressable onPress={switchMode} disabled={busy} accessibilityRole="button" style={styles.switchButton}>
            <ThemedText size={14} weight={600} tone="accent">{copy.switchTo}</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  head: { gap: 8 },
  koala: { marginBottom: 20 },
  form: { marginTop: 40, gap: 20 },
  reveal: { height: 44, paddingHorizontal: 12, justifyContent: 'center' },
  submit: { height: 52, alignItems: 'center', justifyContent: 'center' },
  link: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  switchRow: { marginTop: 'auto', paddingTop: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  switchButton: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
});
