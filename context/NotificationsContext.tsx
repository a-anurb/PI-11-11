import { useCloudValue } from '../lib/cloudData';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

export type NotificationKind = 'reminder' | 'goal' | 'transaction' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  /** ISO date-time */
  createdAt: string;
  read: boolean;
}

export interface NotificationSettings {
  goals: boolean;
  spendingAlerts: boolean;
  weeklySummary: boolean;
  transactions: boolean;
  reminders: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoaded: boolean;
  /** cria um aviso (respeita as configurações do usuário) */
  notify: (kind: NotificationKind, title: string, message: string, settingKey?: keyof NotificationSettings) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleSetting: (key: keyof NotificationSettings) => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const LIST_KEY_BASE = 'finapp_notifications';
const SETTINGS_KEY_BASE = 'finapp_notification_settings';
const META_KEY_BASE = 'finapp_notifications_meta';
const MAX_ITEMS = 100;

const defaultSettings: NotificationSettings = {
  goals: true,
  spendingAlerts: true,
  weeklySummary: false,
  transactions: true,
  reminders: true,
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  // dados separados por usuário logado
  const [notifications, setNotifications, listLoaded] = useCloudValue<AppNotification[]>(LIST_KEY_BASE, []);
  const [settings, setSettings, settingsLoaded] = useCloudValue<NotificationSettings>(SETTINGS_KEY_BASE, defaultSettings);
  const [meta, setMeta, metaLoaded] = useCloudValue<{ welcomed?: boolean; lastReminder?: string }>(META_KEY_BASE, {});
  const isLoaded = listLoaded && settingsLoaded && metaLoaded;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Mensagens automáticas criadas somente após sincronizar configurações e metadados.
  useEffect(() => {
    if (!isLoaded) return;
    const extra: AppNotification[] = [];
    const now = new Date().toISOString();
    if (!meta.welcomed) extra.push({ id: `sys_${Date.now()}`, kind: 'system', title: 'Bem-vindo ao MonY', message: 'Registre receitas e despesas, crie metas e acompanhe seus avisos por aqui.', createdAt: now, read: false });
    if (settings.reminders && meta.lastReminder !== todayKey()) extra.push({ id: `rem_${Date.now()}`, kind: 'reminder', title: 'Lembrete do dia', message: 'Não esqueça de registrar seus gastos e receitas de hoje.', createdAt: now, read: false });
    if (extra.length) setNotifications((old) => [...extra, ...old].slice(0, MAX_ITEMS));
    if (!meta.welcomed || (settings.reminders && meta.lastReminder !== todayKey())) {
      setMeta({ ...meta, welcomed: true, lastReminder: settings.reminders ? todayKey() : meta.lastReminder });
    }
  }, [isLoaded, meta.welcomed, meta.lastReminder, settings.reminders]);

  const notify = useCallback<NotificationsContextType['notify']>((kind, title, message, settingKey) => {
    if (settingKey && !settingsRef.current[settingKey]) return;
    const item: AppNotification = {
      id: `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      kind,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, MAX_ITEMS));
  }, []);

  const markAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const removeNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const clearAll = () => setNotifications([]);
  const toggleSetting = (key: keyof NotificationSettings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        isLoaded,
        notify,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        toggleSetting,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
