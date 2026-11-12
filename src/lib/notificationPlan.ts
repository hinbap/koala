import type { Alarm } from './alarms';

export interface AlarmNotificationPlan {
  identifier: string;
  alarm: Alarm;
  weekday?: number;
  date?: number;
  hour: number;
  minute: number;
}

/** Calendar triggers preserve the selected local wake-up time across DST. */
export function notificationPlan(alarms: Alarm[], now: number): AlarmNotificationPlan[] {
  return alarms.filter(a => a.on).flatMap<AlarmNotificationPlan>(alarm => {
    const base = { alarm, hour: alarm.hour % 12 + (alarm.meridiem === 'PM' ? 12 : 0), minute: alarm.minute };
    if (!alarm.days.some(Boolean)) {
      return alarm.oneTimeAt !== undefined && alarm.oneTimeAt > now
        ? [{ ...base, identifier: `koala.alarm.${alarm.id}.once`, date: alarm.oneTimeAt }]
        : [];
    }
    return alarm.days.flatMap((on, day) => on ? [{ ...base, identifier: `koala.alarm.${alarm.id}.${day}`, weekday: day + 1 }] : []);
  });
}
