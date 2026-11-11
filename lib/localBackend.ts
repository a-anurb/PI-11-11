import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// MODO LOCAL (sem servidor)
// -----------------------------------------------------------------------------
// Responde às MESMAS rotas do servidor (server/index.js), mas guarda tudo no
// próprio aparelho (AsyncStorage). Assim o app funciona sozinho agora e, quando
// o banco de dados/servidor estiver pronto, basta definir EXPO_PUBLIC_API_URL
// (ver lib/api.ts) — as telas não mudam.
//
// Limitação do modo local: não há envio de e-mail. Os códigos de verificação
// aparecem na própria tela, identificados como "modo local".
// =============================================================================

type Avatar = { type: 'preset' | 'initials' | 'photo' | 'custom'; value: string };

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatar: Avatar | null;
  previousAvatar: Avatar | null;
  createdAt: string;
}
interface Session {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}
interface Verification {
  id: string;
  userId: string;
  purpose: 'phone' | 'email' | 'reset';
  newValue: string | null;
  codeHash: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  usedAt: number | null;
}
interface DB {
  users: User[];
  sessions: Session[];
  verifications: Verification[];
}

const DB_KEY = 'mony_local_db';
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class LocalError extends Error {
  status: number;
  code: string;
  extra: Record<string, unknown>;
  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

// ---------------------------------------------------------------- helpers
function hash(s: string): string {
  // hash simples (FNV-1a, 2 × 32 bits) — evita guardar senha/código em texto puro
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 2246822519) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
const rand = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 36).toString(36)).join('');
const newId = (p: string) => `${p}_${Date.now().toString(36)}${rand(8)}`;
const hashPassword = (pw: string, salt = rand(12)) => `${salt}:${hash(`${salt}::${pw}::mony`)}`;
const checkPassword = (pw: string, stored: string) => {
  const [salt] = stored.split(':');
  return hashPassword(pw, salt) === stored;
};
const normEmail = (e: unknown) => String(e ?? '').trim().toLowerCase();
const onlyDigits = (s: unknown) => String(s ?? '').replace(/\D/g, '');
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const formatPhone = (d: string) =>
  d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d;
const maskEmail = (e: string) => {
  const [u, d] = e.split('@');
  const shown = u.length <= 2 ? u[0] : u.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(2, u.length - shown.length))}@${d}`;
};
const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  avatar: u.avatar,
  hasPreviousAvatar: !!u.previousAvatar,
  createdAt: u.createdAt,
});

async function load(): Promise<DB> {
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) return { users: [], sessions: [], verifications: [], ...JSON.parse(raw) };
  } catch {
    // começa vazio
  }
  return { users: [], sessions: [], verifications: [] };
}
async function save(db: DB) {
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new LocalError(507, 'STORAGE_FULL', 'Sem espaço para salvar no aparelho. Tente uma foto menor.');
  }
}

function currentUser(db: DB, token: string | null): User {
  if (!token) throw new LocalError(401, 'UNAUTHENTICATED', 'Faça login para continuar.');
  const s = db.sessions.find((x) => x.tokenHash === hash(token));
  if (!s || Date.now() > s.expiresAt) throw new LocalError(401, 'UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.');
  const u = db.users.find((x) => x.id === s.userId);
  if (!u) throw new LocalError(401, 'UNAUTHENTICATED', 'Conta não encontrada.');
  return u;
}

function createVerification(db: DB, userId: string, purpose: Verification['purpose'], newValue: string | null) {
  const now = Date.now();
  const last = db.verifications
    .filter((v) => v.userId === userId && v.purpose === purpose)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (last && now - last.createdAt < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now - last.createdAt)) / 1000);
    throw new LocalError(429, 'COOLDOWN', `Aguarde ${retryAfter}s para pedir um novo código.`, { retryAfter });
  }
  db.verifications.forEach((v) => {
    if (v.userId === userId && v.purpose === purpose && !v.usedAt) v.usedAt = now;
  });
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  const v: Verification = {
    id: newId('ver'),
    userId,
    purpose,
    newValue,
    codeHash: hash(code),
    attempts: 0,
    createdAt: now,
    expiresAt: now + CODE_TTL_MS,
    usedAt: null,
  };
  db.verifications = [...db.verifications.filter((x) => now - x.createdAt < 86_400_000), v];
  return { v, code };
}

function checkCode(v: Verification | undefined, code: unknown) {
  const now = Date.now();
  if (!v || v.usedAt) throw new LocalError(400, 'INVALID', 'Este código não é mais válido. Peça um novo código.');
  if (now > v.expiresAt) throw new LocalError(410, 'EXPIRED', 'O código expirou. Peça um novo código.');
  if (v.attempts >= CODE_MAX_ATTEMPTS) throw new LocalError(429, 'TOO_MANY_ATTEMPTS', 'Muitas tentativas erradas. Peça um novo código.');
  v.attempts += 1;
  if (hash(String(code ?? '').trim()) !== v.codeHash) {
    const left = CODE_MAX_ATTEMPTS - v.attempts;
    if (left <= 0) return new LocalError(429, 'TOO_MANY_ATTEMPTS', 'Muitas tentativas erradas. Peça um novo código.');
    return new LocalError(400, 'WRONG_CODE', `Código incorreto. Você ainda tem ${left} tentativa${left > 1 ? 's' : ''}.`, { attemptsLeft: left });
  }
  v.usedAt = now; // uso único
  return null;
}

// ---------------------------------------------------------------- rotas
export async function localRequest(path: string, method: string, body: any, token: string | null): Promise<any> {
  const db = await load();
  const route = `${method} ${path}`;
  const b = body ?? {};

  switch (route) {
    case 'POST /api/auth/register': {
      const name = String(b.name ?? '').trim();
      const email = normEmail(b.email);
      const phone = onlyDigits(b.phone);
      const password = String(b.password ?? '');
      if (name.length < 2) throw new LocalError(400, 'INVALID_NAME', 'Informe seu nome.');
      if (!isEmail(email)) throw new LocalError(400, 'INVALID_EMAIL', 'E-mail inválido.');
      if (phone && (phone.length < 10 || phone.length > 11)) throw new LocalError(400, 'INVALID_PHONE', 'Telefone inválido.');
      if (password.length < 6) throw new LocalError(400, 'WEAK_PASSWORD', 'A senha precisa ter pelo menos 6 caracteres.');
      if (db.users.some((u) => u.email === email)) throw new LocalError(409, 'EMAIL_TAKEN', 'Já existe uma conta com esse e-mail.');
      db.users.push({
        id: newId('usr'),
        name,
        email,
        phone: phone ? formatPhone(phone) : '',
        passwordHash: hashPassword(password),
        avatar: { type: 'initials', value: '0' },
        previousAvatar: null,
        createdAt: new Date().toISOString(),
      });
      await save(db);
      return { ok: true, email };
    }

    case 'POST /api/auth/login': {
      const email = normEmail(b.email);
      const user = db.users.find((u) => u.email === email);
      if (!user || !checkPassword(String(b.password ?? ''), user.passwordHash)) {
        throw new LocalError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
      }
      const t = `${rand(24)}${Date.now().toString(36)}${rand(16)}`;
      db.sessions = [...db.sessions.filter((s) => s.expiresAt > Date.now()), { tokenHash: hash(t), userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS }];
      await save(db);
      return { token: t, user: publicUser(user) };
    }

    case 'POST /api/auth/logout': {
      if (token) db.sessions = db.sessions.filter((s) => s.tokenHash !== hash(token));
      await save(db);
      return { ok: true };
    }

    case 'GET /api/me':
      return { user: publicUser(currentUser(db, token)) };

    case 'PATCH /api/me': {
      const u = currentUser(db, token);
      const name = String(b.name ?? '').trim();
      if (name.length < 2) throw new LocalError(400, 'INVALID_NAME', 'Informe seu nome.');
      u.name = name;
      await save(db);
      return { user: publicUser(u) };
    }

    case 'POST /api/me/password': {
      const u = currentUser(db, token);
      if (!checkPassword(String(b.currentPassword ?? ''), u.passwordHash)) throw new LocalError(400, 'WRONG_PASSWORD', 'Senha atual incorreta.');
      if (String(b.newPassword ?? '').length < 6) throw new LocalError(400, 'WEAK_PASSWORD', 'A nova senha precisa ter pelo menos 6 caracteres.');
      u.passwordHash = hashPassword(String(b.newPassword));
      const keep = hash(token ?? '');
      db.sessions = db.sessions.filter((s) => s.userId !== u.id || s.tokenHash === keep);
      await save(db);
      return { ok: true };
    }

    case 'PUT /api/me/avatar': {
      const u = currentUser(db, token);
      let next: Avatar;
      if (b.type === 'preset' || b.type === 'initials') {
        next = { type: b.type, value: String(b.value) };
      } else if (b.type === 'custom') {
        if (!/^[a-z0-9.\-]{1,200}$/i.test(String(b.value ?? ''))) throw new LocalError(400, 'INVALID_AVATAR', 'Avatar inválido.');
        next = { type: 'custom', value: String(b.value) };
      } else if (b.type === 'photo') {
        const clean = String(b.base64 ?? '').replace(/^data:[^;]+;base64,/, '');
        if (clean.length < 100) throw new LocalError(400, 'INVALID_IMAGE', 'Imagem inválida.');
        if (clean.length > 2_000_000) {
          throw new LocalError(413, 'IMAGE_TOO_BIG', 'A imagem é muito grande para guardar no aparelho. Recorte ou escolha uma menor.');
        }
        next = { type: 'photo', value: `data:${b.mime || 'image/jpeg'};base64,${clean}` };
      } else {
        throw new LocalError(400, 'INVALID_AVATAR', 'Tipo de avatar inválido.');
      }
      u.previousAvatar = u.avatar;
      u.avatar = next;
      await save(db);
      return { user: publicUser(u) };
    }

    case 'POST /api/me/avatar/restore': {
      const u = currentUser(db, token);
      if (!u.previousAvatar) throw new LocalError(400, 'NO_PREVIOUS', 'Não há avatar anterior para restaurar.');
      [u.avatar, u.previousAvatar] = [u.previousAvatar, u.avatar];
      await save(db);
      return { user: publicUser(u) };
    }

    case 'POST /api/me/phone/request': {
      const u = currentUser(db, token);
      const d = onlyDigits(b.newPhone);
      if (d.length < 10 || d.length > 11) throw new LocalError(400, 'INVALID_PHONE', 'Informe um telefone válido com DDD.');
      const newPhone = formatPhone(d);
      if (newPhone === u.phone) throw new LocalError(400, 'SAME_VALUE', 'Esse já é o seu telefone atual.');
      const { v, code } = createVerification(db, u.id, 'phone', newPhone);
      await save(db);
      return { verificationId: v.id, sentTo: maskEmail(u.email), expiresAt: v.expiresAt, delivery: 'local', devCode: code };
    }

    case 'POST /api/me/phone/confirm': {
      const u = currentUser(db, token);
      const v = db.verifications.find((x) => x.id === b.verificationId && x.userId === u.id && x.purpose === 'phone');
      const err = checkCode(v, b.code);
      await save(db);
      if (err) throw err;
      u.phone = v!.newValue!; // só altera depois do código
      await save(db);
      return { user: publicUser(u) };
    }

    case 'POST /api/me/email/request': {
      const u = currentUser(db, token);
      const newEmail = normEmail(b.newEmail);
      if (!isEmail(newEmail)) throw new LocalError(400, 'INVALID_EMAIL', 'Informe um e-mail válido.');
      if (newEmail === u.email) throw new LocalError(400, 'SAME_VALUE', 'Esse já é o seu e-mail atual.');
      if (db.users.some((x) => x.email === newEmail)) throw new LocalError(409, 'EMAIL_TAKEN', 'Esse e-mail já está em uso por outra conta.');
      const { v, code } = createVerification(db, u.id, 'email', newEmail);
      await save(db);
      return { verificationId: v.id, sentTo: maskEmail(newEmail), expiresAt: v.expiresAt, delivery: 'local', devCode: code };
    }

    case 'POST /api/me/email/confirm': {
      const u = currentUser(db, token);
      const v = db.verifications.find((x) => x.id === b.verificationId && x.userId === u.id && x.purpose === 'email');
      const err = checkCode(v, b.code);
      await save(db);
      if (err) throw err;
      if (db.users.some((x) => x.email === v!.newValue && x.id !== u.id)) {
        throw new LocalError(409, 'EMAIL_TAKEN', 'Esse e-mail passou a ser usado por outra conta.');
      }
      u.email = v!.newValue!;
      await save(db);
      return { user: publicUser(u) };
    }

    case 'POST /api/auth/password-reset/request': {
      const email = normEmail(b.email);
      if (!isEmail(email)) throw new LocalError(400, 'INVALID_EMAIL', 'Informe um e-mail válido.');
      const u = db.users.find((x) => x.email === email);
      if (!u) throw new LocalError(404, 'NOT_FOUND', 'Não encontramos uma conta com esse e-mail neste aparelho.');
      const { code } = createVerification(db, u.id, 'reset', null);
      await save(db);
      return { ok: true, sentTo: maskEmail(email), delivery: 'local', devCode: code };
    }

    case 'POST /api/auth/password-reset/confirm': {
      const email = normEmail(b.email);
      const u = db.users.find((x) => x.email === email);
      if (String(b.newPassword ?? '').length < 6) throw new LocalError(400, 'WEAK_PASSWORD', 'A nova senha precisa ter pelo menos 6 caracteres.');
      const v = u
        ? db.verifications.filter((x) => x.userId === u.id && x.purpose === 'reset' && !x.usedAt).sort((a, c) => c.createdAt - a.createdAt)[0]
        : undefined;
      const err = checkCode(v, b.code);
      await save(db);
      if (err) throw err;
      u!.passwordHash = hashPassword(String(b.newPassword));
      db.sessions = db.sessions.filter((s) => s.userId !== u!.id);
      await save(db);
      return { ok: true };
    }

    default:
      throw new LocalError(404, 'NOT_FOUND', 'Rota não encontrada.');
  }
}
