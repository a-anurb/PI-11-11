import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { localRequest, LocalError } from './localBackend';

// -----------------------------------------------------------------------------
// ONDE FICAM AS CONTAS
//  • Padrão: MODO LOCAL — tudo salvo no próprio aparelho (lib/localBackend.ts).
//    Não precisa de servidor nenhum.
//  • Com servidor/banco: crie um arquivo ".env" na raiz do projeto com
//        EXPO_PUBLIC_API_URL=http://SEU-IP:3333      (ou "auto")
//    e rode o servidor (npm run server). "auto" usa o IP do computador do Expo.
// -----------------------------------------------------------------------------
const API_ENV = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
export const USE_SERVER = API_ENV.length > 0;

function resolveApiUrl(): string {
  if (API_ENV && API_ENV !== 'auto') return API_ENV.replace(/\/$/, '');
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host || 'localhost'}:3333`;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:3333`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  code: string;
  status: number;
  attemptsLeft?: number;
  retryAfter?: number;
  constructor(status: number, code: string, message: string, extra: { attemptsLeft?: number; retryAfter?: number } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.attemptsLeft = extra.attemptsLeft;
    this.retryAfter = extra.retryAfter;
  }
}

let authToken: string | null = null;
export const setApiToken = (t: string | null) => {
  authToken = t;
};

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = options.method ?? (options.body ? 'POST' : 'GET');

  // Modo local: responde no próprio aparelho
  if (!USE_SERVER) {
    try {
      return (await localRequest(path, method, options.body, authToken)) as T;
    } catch (e) {
      if (e instanceof LocalError) throw new ApiError(e.status, e.code, e.message, e.extra as any);
      throw new ApiError(500, 'ERROR', 'Algo deu errado. Tente novamente.');
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK',
      'Não foi possível conectar ao servidor do MonY. Verifique sua internet ou se o servidor está rodando.'
    );
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // resposta sem JSON
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'ERROR', data?.message ?? 'Algo deu errado. Tente novamente.', {
      attemptsLeft: data?.attemptsLeft,
      retryAfter: data?.retryAfter,
    });
  }
  return data as T;
}

/** URL completa de um arquivo enviado (ex.: foto de perfil) */
export const fileUrl = (path: string) =>
  path.startsWith('http') || path.startsWith('data:') || path.startsWith('file:') ? path : `${API_URL}${path}`;
