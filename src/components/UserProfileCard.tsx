import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../theme/ThemeProvider';
import { chooseAvatar } from '../lib/avatar';
import { Icon } from './ui/Icon';
import { ThemedText } from './ui/ThemedText';

export interface UserProfile {
  nickname: string;
  displayName: string;
  avatarUri: string | null;
}
interface Props {
  profile: UserProfile;
  onAvatarChange: (uri: string) => Promise<void>;
  onLogout: (() => Promise<void>) | null;
  loading?: boolean;
}

export function UserProfileCard({ profile, onAvatarChange, onLogout, loading = false }: Props) {
  const t = useTheme();
  const [busy, setBusy] = useState<'photo' | 'logout' | null>(null);
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initials = (profile.displayName || profile.nickname || 'Guest').trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();

  const changePhoto = async () => {
    if (inFlight.current || loading) return;
    inFlight.current = true;
    setBusy('photo');
    setError(null);
    try {
      const avatar = await chooseAvatar();
      if (avatar) await onAvatarChange(avatar);
    } catch {
      setError('Could not update your photo. Try again, or check photo access in your device settings.');
    } finally { inFlight.current = false; setBusy(null); }
  };
  const logout = async () => {
    if (inFlight.current || !onLogout) return;
    inFlight.current = true;
    setBusy('logout');
    setError(null);
    try { await onLogout(); }
    catch { setError('Could not log out. Please try again.'); }
    finally { inFlight.current = false; setBusy(null); }
  };

  return (
    <View style={styles.section}>
      <ThemedText caption tone="muted" accessibilityRole="header">Your profile</ThemedText>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line, borderRadius: t.def.radius }]}>
        <View style={styles.details}>
          <Pressable
            onPress={() => void changePhoto()}
            disabled={busy !== null || loading}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            accessibilityHint="Choose an avatar from your photo library."
            accessibilityState={{ disabled: busy !== null || loading, busy: busy === 'photo' }}
            style={styles.avatarButton}
          >
            <View style={[styles.avatar, { backgroundColor: t.soft, borderColor: t.line }]}>
              {busy === 'photo' ? <ActivityIndicator color={t.accent} /> : profile.avatarUri && failedImage !== profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.photo} contentFit="cover" onError={() => setFailedImage(profile.avatarUri)} />
              ) : <ThemedText face="display" size={28} tone="accent">{initials}</ThemedText>}
            </View>
            <View style={[styles.editBadge, { backgroundColor: t.accent, borderColor: t.surface }]}>
              <Icon name="pencil" size={13} color={t.onAccent} />
            </View>
          </Pressable>
          <View style={styles.identity}>
            <ThemedText caption tone="muted">Display name</ThemedText>
            <ThemedText face="display" size={24} lineHeight={30}>{profile.displayName || 'Guest'}</ThemedText>
            <ThemedText caption tone="muted" style={styles.nicknameLabel}>Nickname</ThemedText>
            <ThemedText size={14} tone="muted">{profile.nickname ? `@${profile.nickname.replace(/^@/, '')}` : 'Not set'}</ThemedText>
          </View>
        </View>
        <View style={[styles.footer, { borderTopColor: t.line }]}>
          <ThemedText size={12} tone="muted" style={styles.help}>Tap your photo to change it.</ThemedText>
          <Pressable onPress={() => void logout()} disabled={!onLogout || busy !== null || loading} accessibilityRole="button" accessibilityLabel="Log out" accessibilityState={{ disabled: !onLogout || busy !== null || loading }} style={[styles.logout, (!onLogout || busy !== null || loading) && { opacity: 0.45 }]}>
            <ThemedText size={14} weight={500} tone="alarm">{busy === 'logout' ? 'Logging out…' : 'Log out'}</ThemedText>
          </Pressable>
        </View>
        {!onLogout && !loading && <ThemedText size={12} tone="muted">You’re not signed in.</ThemedText>}
        {error && <ThemedText size={14} tone="alarm" accessibilityRole="alert">{error}</ThemedText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  card: { borderWidth: 1, padding: 16, gap: 12 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarButton: { width: 88, height: 88 },
  avatar: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  photo: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, minWidth: 0, gap: 3 },
  nicknameLabel: { marginTop: 5 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, paddingTop: 4 },
  help: { flex: 1 },
  logout: { minHeight: 44, minWidth: 64, justifyContent: 'center', alignItems: 'flex-end' },
});
