import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import type * as Notifications from 'expo-notifications';
import { useStore } from './AppStore';
import { notificationPlan } from '../lib/notificationPlan';
import { reconcileNotifications } from '../lib/reconcileNotifications';

type API = typeof Notifications;
let apiPromise: Promise<API> | undefined;
function getAPI() {
  return apiPromise ??= import('expo-notifications');
}
const PREFIX = 'koala.';
const BACKUP = `${PREFIX}backup`;
interface NotificationStatus {
  message: string;
  error: string | null;
  busy: boolean;
  enable: () => Promise<void>;
}
const Context = createContext<NotificationStatus | null>(null);

export function AlarmNotificationsProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { alarms, settings, ringing, alarmActive } = store;
  const latest = useRef(store);
  useEffect(() => { latest.current = store; });
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [exact, setExact] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const queue = useRef(Promise.resolve());
  const restored = useRef(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const N = await getAPI();
    const permissions = await N.getPermissionsAsync();
    setAllowed(permissions.granted);
    setExact(Platform.OS !== 'android' || (await N.getExactAlarmPermissionsAsync()).granted);
    setRevision(r => r + 1);
  }, []);

  useEffect(() => {
    // The navigator is mounted before restoring a persisted alarm screen.
    if (!restored.current) {
      restored.current = true;
      if (latest.current.alarmActive) router.navigate('/puzzle');
    }
    if (Platform.OS === 'web') return;
    let alive = true;
    const subscriptions: { remove: () => void }[] = [];
    const receive = (notification: Notifications.Notification, tapped: boolean) => {
      if (!tapped && AppState.currentState !== 'active') return;
      const data = notification.request.content.data;
      if (data?.owner !== 'koala') return;
      const current = latest.current;
      if (data.kind === 'backup') {
        if (current.alarmActive && current.ringing?.id === data.sessionId && tapped) router.navigate('/puzzle');
        return;
      }
      const alarm = current.alarms.find(a => a.id === data.alarmId && a.on);
      if (alarm) current.startRinging(alarm, notification.date);
      else if (current.alarmActive && tapped) router.navigate('/puzzle');
    };
    getAPI().then(async N => {
      if (!alive) return;
      N.setNotificationHandler({ handleNotification: async () => {
        const background = AppState.currentState !== 'active';
        return { shouldShowBanner: background, shouldShowList: background, shouldPlaySound: background, shouldSetBadge: false };
      } });
      subscriptions.push(N.addNotificationReceivedListener(n => receive(n, false)));
      subscriptions.push(N.addNotificationResponseReceivedListener(response => {
        receive(response.notification, true);
        void N.clearLastNotificationResponseAsync().catch(console.warn);
      }));
      const response = N.getLastNotificationResponse();
      if (response) {
        receive(response.notification, true);
        await N.clearLastNotificationResponseAsync();
      }
      await refresh();
    }).catch(() => { if (alive) setError('Notifications are unavailable. Install a new development build.'); });
    const appState = AppState.addEventListener('change', status => {
      if (status === 'active') void refresh().catch(() => setError('Could not check notification permissions.'));
    });
    return () => { alive = false; subscriptions.forEach(s => s.remove()); appState.remove(); };
  }, [refresh]);

  const enable = useCallback(async () => {
    if (Platform.OS === 'web') return;
    setBusy(true);
    setError(null);
    try {
      const N = await getAPI();
      if (Platform.OS === 'android') {
        // Android requires a channel before the notification permission prompt.
        await N.setNotificationChannelAsync('koala.permission', { name: 'Alarm reminders', importance: N.AndroidImportance.HIGH });
      }
      let permissions = await N.getPermissionsAsync();
      const wasGranted = permissions.granted;
      if (!permissions.granted && permissions.canAskAgain) permissions = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
      if (!permissions.granted && !permissions.canAskAgain) await Linking.openSettings();
      if (permissions.granted && Platform.OS === 'android' && !(await N.getExactAlarmPermissionsAsync()).granted) await N.requestExactAlarmPermissionsAsync();
      else if (wasGranted) await Linking.openSettings();
      await refresh();
    } catch { setError('Could not enable notifications. Check the app’s notification permissions in system settings.'); }
    finally { setBusy(false); }
  }, [refresh]);

  const vibration = settings.vibrate;
  const backup = settings.backupAlarm && alarmActive ? ringing : null;
  useEffect(() => {
    if (Platform.OS === 'web' || allowed === null) return;
    let stale = false;
    // All native changes run in order, including rapid toggles and solve/cancel races.
    queue.current = queue.current.then(async () => {
      if (stale) return;
      const N = await getAPI();
      const existing = await N.getAllScheduledNotificationsAsync();
      const desired: Notifications.NotificationRequestInput[] = [];
      if (allowed) {
        const channelId = `koala.alarms.v1.${vibration ? 'vibrate' : 'quiet'}`;
        if (Platform.OS === 'android') await N.setNotificationChannelAsync(channelId, {
          name: vibration ? 'Alarms with vibration' : 'Alarms without vibration',
          importance: N.AndroidImportance.MAX, sound: 'nuclear-notification.wav', enableVibrate: vibration,
          vibrationPattern: vibration ? [0, 500, 500, 500] : [0],
          audioAttributes: { usage: N.AndroidAudioUsage.ALARM, contentType: N.AndroidAudioContentType.SONIFICATION },
        });
        for (const plan of notificationPlan(alarms, Date.now())) {
          const signature = JSON.stringify([plan.alarm, vibration]);
          desired.push({ identifier: plan.identifier,
            content: { title: plan.alarm.label, body: 'Time to wake up. Open Koala and solve your sudoku.', sound: 'nuclear-notification.wav',
              data: { owner: 'koala', kind: 'alarm', alarmId: plan.alarm.id, signature },
            },
            trigger: plan.date !== undefined
              ? { type: N.SchedulableTriggerInputTypes.DATE, date: plan.date, channelId, delivery: 'alarmClock' }
              : { type: N.SchedulableTriggerInputTypes.WEEKLY, weekday: plan.weekday!, hour: plan.hour, minute: plan.minute, channelId, delivery: 'alarmClock' },
          });
        }
        if (backup) desired.push({ identifier: BACKUP,
          content: { title: `${backup.label} · Still awake?`, body: 'Your alarm puzzle is unfinished. Open Koala to finish it.', sound: 'nuclear-notification.wav',
            data: { owner: 'koala', kind: 'backup', sessionId: backup.id, signature: `${backup.id}:${vibration}` },
          },
          trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60, repeats: true, channelId },
        });
        // Leave room under iOS's 64 pending-notification limit for other app features.
        if (Platform.OS === 'ios' && desired.length > 60) throw new Error('Too many alarm days to schedule. Disable some alarms (maximum 60 scheduled reminders).');
      }
      await reconcileNotifications(existing, desired, N.cancelScheduledNotificationAsync, N.scheduleNotificationAsync);
      if (!backup) await N.dismissNotificationAsync(BACKUP);
      if (!stale) setError(null);
    }).catch(reason => { if (!stale) setError(reason instanceof Error ? reason.message : 'Could not schedule alarm notifications.'); });
    return () => { stale = true; };
  }, [alarms, allowed, vibration, backup, revision]);

  const message = Platform.OS === 'web'
    ? 'Web alarms work while this page stays open. Background reminders and vibration require the mobile app.'
    : allowed === null ? 'Checking notification permissions…'
      : !allowed ? 'Enable notifications for alarms and backup reminders when the app is closed.'
      : !exact ? 'Notifications enabled. Allow exact alarms for on-time delivery on Android.'
        : 'Alarm notifications enabled. System sound, Focus, and battery settings still apply.';
  return <Context.Provider value={{ message, error, busy, enable }}>{children}</Context.Provider>;
}

export function useAlarmNotifications() {
  const context = useContext(Context);
  if (!context) throw new Error('Missing AlarmNotificationsProvider');
  return context;
}
