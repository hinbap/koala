import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { UserProfile, UserProfileCard } from './UserProfileCard';
import { ThemedText } from './ui/ThemedText';

const STORAGE_KEY = 'koala.local-profile.v1';
const EMPTY_PROFILE: UserProfile = { nickname: '', displayName: '', avatarUri: null };
interface LocalProfileState { active: boolean; profile: UserProfile }
const INITIAL_STATE: LocalProfileState = { active: true, profile: EMPTY_PROFILE };

function restoreProfile(raw: string | null): LocalProfileState {
  if (!raw) return INITIAL_STATE;
  const value = JSON.parse(raw) as Partial<LocalProfileState>;
  const saved = value?.profile;
  return {
    active: value?.active !== false,
    profile: {
      nickname: typeof saved?.nickname === 'string' ? saved.nickname.slice(0, 30) : '',
      displayName: typeof saved?.displayName === 'string' ? saved.displayName.slice(0, 60) : '',
      avatarUri: typeof saved?.avatarUri === 'string' && saved.avatarUri.startsWith('data:image/jpeg;base64,') ? saved.avatarUri : null,
    },
  };
}

export function LocalUserProfile() {
  const t = useTheme();
  const [state, setState] = useState(INITIAL_STATE);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      const restored = restoreProfile(raw);
      if (alive) { current.current = restored; setState(restored); }
    }).catch(() => {
      if (alive) setError('Your local profile could not be loaded. Please try reopening Settings.');
    }).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  // Commit storage first so a failed write never looks like a successful save or logout.
  const save = (change: (previous: LocalProfileState) => LocalProfileState): Promise<void> => {
    const operation = writes.current.then(async () => {
      const next = change(current.current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setState(next);
    });
    writes.current = operation.catch(() => {});
    return operation;
  };

  const saveNames = async () => {
    const name = displayName.trim();
    const handle = nickname.trim().replace(/^@/, '');
    if (!name || !handle) { setError('Enter a display name and nickname.'); return; }
    if (!/^[\p{L}\p{N}_.-]{1,30}$/u.test(handle)) { setError('Use up to 30 letters, numbers, dots, underscores, or hyphens for your nickname.'); return; }
    setBusy(true);
    setError(null);
    try {
      await save(s => ({ ...s, profile: { ...s.profile, displayName: name, nickname: handle } }));
      setEditing(false);
    } catch { setError('Your profile could not be saved. Check available device storage and try again.'); }
    finally { setBusy(false); }
  };

  if (!ready) return <ActivityIndicator color={t.accent} accessibilityLabel="Loading profile" />;

  return (
    <View style={styles.section}>
      {state.active ? <>
        <UserProfileCard
          profile={state.profile}
          loading={busy}
          onAvatarChange={avatarUri => save(s => ({ ...s, profile: { ...s.profile, avatarUri } }))}
          onLogout={async () => {
            await save(s => ({ ...s, active: false }));
            setEditing(false);
            setError(null);
          }}
        />
        {!editing && <View style={styles.actions}>
          <ThemedText size={12} tone="muted" style={styles.hint}>Local profile · saved on this device</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => {
            setDisplayName(state.profile.displayName);
            setNickname(state.profile.nickname);
            setEditing(true);
            setError(null);
          }} style={styles.button}>
            <ThemedText size={14} tone="accent">Edit profile</ThemedText>
          </Pressable>
        </View>}
        {editing && <View style={[styles.editor, { borderColor: t.line, borderRadius: t.def.radius }]}>
          <ThemedText size={14}>Display name</ThemedText>
          <TextInput
            value={displayName} onChangeText={setDisplayName} maxLength={60} editable={!busy}
            accessibilityLabel="Display name" placeholder="Your display name" autoCapitalize="words" autoComplete="name"
            placeholderTextColor={t.muted} selectionColor={t.accent}
            style={[styles.input, { color: t.ink, borderColor: t.line, fontFamily: t.def.body[400] }]}
          />
          <ThemedText size={14}>Nickname</ThemedText>
          <TextInput
            value={nickname} onChangeText={setNickname} maxLength={31} editable={!busy}
            accessibilityLabel="Nickname" placeholder="Your nickname" autoCapitalize="none" autoCorrect={false}
            placeholderTextColor={t.muted} selectionColor={t.accent} returnKeyType="done" onSubmitEditing={() => { if (!busy) void saveNames(); }}
            style={[styles.input, { color: t.ink, borderColor: t.line, fontFamily: t.def.body[400] }]}
          />
          <View style={styles.formActions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setEditing(false); setError(null); }} style={styles.button}>
              <ThemedText size={14} tone="muted">Cancel</ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void saveNames()} style={styles.button}>
              <ThemedText size={14} tone="accent">{busy ? 'Saving…' : 'Save profile'}</ThemedText>
            </Pressable>
          </View>
        </View>}
      </> : <View style={[styles.editor, { borderColor: t.line, borderRadius: t.def.radius }]}>
        <ThemedText caption tone="muted" accessibilityRole="header">Your profile</ThemedText>
        <ThemedText face="display" size={24}>You’re logged out.</ThemedText>
        <ThemedText size={14} tone="muted">Your local profile is saved on this device.</ThemedText>
        <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={async () => {
          setBusy(true);
          setError(null);
          try { await save(s => ({ ...s, active: true })); }
          catch { setError('Could not restore your local profile. Please try again.'); }
          finally { setBusy(false); }
        }}>
          <ThemedText tone="accent">{busy ? 'Loading…' : 'Continue with local profile'}</ThemedText>
        </Pressable>
      </View>}
      {error && <ThemedText size={14} tone="alarm" accessibilityRole="alert">{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  hint: { flex: 1 },
  button: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  editor: { borderWidth: 1, padding: 16, gap: 12 },
  input: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 8, fontSize: 16 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
});
