/** Synchronized per-user data with local cache. The original keys are never erased.
 * On first load cloud wins; if the cloud document doesn't exist, an existing cache for
 * this SAME Firebase UID is uploaded. Old-server IDs require explicit import. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, firebaseAuth } from './firebase';

export const CLOUD_KEYS = [
  'finapp_transactions', 'finapp_goals', 'finapp_custom_categories',
  'finapp_notifications', 'finapp_notification_settings',
  'finapp_notifications_meta', 'finapp_last_weekly_summary',
  'mony_simulations', 'mony_sim_history', 'mony_levelup_seen',
] as const;
export type CloudKey = typeof CLOUD_KEYS[number];

function dataRef(uid: string, key: string) { return doc(db, 'users', uid, 'data', key); }
function cacheKey(uid: string, key: string) { return `${key}:${uid}`; }

export async function readCloudData<T>(uid: string, key: string): Promise<T | null> {
  const snapshot = await getDoc(dataRef(uid, key));
  if (!snapshot.exists()) return null;
  return JSON.parse(snapshot.data().json) as T;
}
export async function writeCloudData<T>(uid: string, key: string, value: T): Promise<void> {
  if (firebaseAuth.currentUser?.uid !== uid) throw new Error('Conta diferente. Entre novamente.');
  const json = JSON.stringify(value);
  await setDoc(dataRef(uid, key), { json, updatedAt: serverTimestamp() });
  await AsyncStorage.setItem(cacheKey(uid, key), json);
}

export function useCloudValue<T>(key: CloudKey, defaultValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const { user } = useAuth();
  const uid = user?.id;
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const current = useRef(value);
  const ready = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    ready.current = false;
    setLoaded(false);
    current.current = defaultValue;
    setValue(defaultValue);
    const path = dataRef(uid, key);
    let stop: (() => void) | undefined;
    (async () => {
      try {
        const local = await AsyncStorage.getItem(cacheKey(uid, key));
        const remote = await getDoc(path);
        if (!alive) return;
        let json: string | null = remote.exists() ? remote.data().json : local;
        if (json) {
          const parsed = JSON.parse(json) as T;
          current.current = parsed;
          setValue(parsed);
        }
        // Import only cache already assigned to this SAME UID, never other accounts.
        if (!remote.exists() && local !== null) {
          await setDoc(path, { json: local, updatedAt: serverTimestamp() });
        } else if (remote.exists() && json) {
          await AsyncStorage.setItem(cacheKey(uid, key), json);
        }
      } catch (e) {
        console.warn(`MonY: leitura de ${key} indisponível; tentando cache local.`, e);
        try {
          const local = await AsyncStorage.getItem(cacheKey(uid, key));
          if (local && alive) {
            current.current = JSON.parse(local) as T;
            setValue(current.current);
          }
        } catch { /* defaults only */ }
      } finally {
        if (alive) {
          ready.current = true;
          setLoaded(true);
          stop = onSnapshot(path, (snapshot) => {
            if (!alive || !snapshot.exists() || pending.current > 0) return;
            const json = snapshot.data().json;
            if (typeof json !== 'string') return;
            try {
              const parsed = JSON.parse(json) as T;
              if (JSON.stringify(current.current) !== json) {
                current.current = parsed;
                setValue(parsed);
              }
              AsyncStorage.setItem(cacheKey(uid, key), json).catch(() => {});
            } catch (e) { console.warn('MonY: documento inválido:', key, e); }
          }, (e) => console.warn('MonY: sincronização indisponível:', key, e));
        }
      }
    })();
    return () => { alive = false; stop?.(); ready.current = false; };
  }, [uid, key]);

  const update: Dispatch<SetStateAction<T>> = useCallback((action) => {
    if (!uid || !ready.current) return;
    const next = typeof action === 'function' ? (action as (prev: T) => T)(current.current) : action;
    current.current = next;
    setValue(next);
    const json = JSON.stringify(next);
    // Cache first: a disconnected device keeps the latest data even if sync fails.
    AsyncStorage.setItem(cacheKey(uid, key), json).catch((e) => console.warn('MonY: erro no cache:', e));
    pending.current++;
    writes.current = writes.current.catch(() => {}).then(async () => {
      if (firebaseAuth.currentUser?.uid !== uid) return;
      await setDoc(dataRef(uid, key), { json, updatedAt: serverTimestamp() });
    }).catch((e) => console.warn(`MonY: falha ao sincronizar ${key}:`, e))
      .finally(() => { pending.current = Math.max(0, pending.current - 1); });
  }, [uid, key]);

  return [value, update, loaded];
}

/** Discover only on-device legacy data; never sends it anywhere until confirmed. */
export async function listLegacySources(currentUid: string): Promise<{ id: string; label: string; count: number }[]> {
  const keys = await AsyncStorage.getAllKeys();
  const sources = new Map<string, number>();
  for (const key of keys) {
    for (const base of CLOUD_KEYS) {
      if (key === base) sources.set('unscoped', (sources.get('unscoped') || 0) + 1);
      else if (key.startsWith(`${base}:`)) {
        const suffix = key.slice(base.length + 1);
        if (suffix && suffix !== currentUid) sources.set(suffix, (sources.get(suffix) || 0) + 1);
      }
    }
  }
  return [...sources].map(([id, count]) => ({
    id, count, label: id === 'unscoped' ? 'Dados sem conta (versão antiga)' : `Conta antiga: ${id.slice(0, 20)}${id.length > 20 ? '…' : ''}`,
  }));
}

/** Only imports missing documents. Existing data is not overwritten or deleted. */
export async function importLegacySource(uid: string, sourceId: string): Promise<{ imported: number; skipped: number }> {
  let imported = 0, skipped = 0;
  for (const base of CLOUD_KEYS) {
    const oldKey = sourceId === 'unscoped' ? base : `${base}:${sourceId}`;
    const value = await AsyncStorage.getItem(oldKey);
    if (value === null) continue;
    const path = dataRef(uid, base);
    if ((await getDoc(path)).exists()) { skipped++; continue; }
    // Decode before upload so malformed local JSON cannot enter Firestore.
    const decoded = JSON.parse(value);
    await writeCloudData(uid, base, decoded);
    imported++;
  }
  return { imported, skipped };
}
