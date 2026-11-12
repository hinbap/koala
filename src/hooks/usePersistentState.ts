import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

/** Hydrate before writing; serialize writes so a slow save cannot overwrite a newer one. */
export function usePersistentState<T>(key: string, initial: T, restore: (data: unknown) => T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restoreRef = useRef(restore);
  const writes = useRef(Promise.resolve());
  const canSave = useRef(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(key).then((raw) => {
      if (alive && raw) setValue(restoreRef.current(JSON.parse(raw)));
      if (alive) canSave.current = true;
    }).catch(() => {
      if (alive) setError('Saved data could not be loaded. Check available device storage.');
    }).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [key]);
  useEffect(() => {
    if (!ready || !canSave.current) return;
    const raw = JSON.stringify(value);
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, raw)).catch(() => {
      setError('Changes could not be saved. Check available device storage.');
    });
  }, [key, value, ready]);
  return { value, setValue, ready, error };
}
