/* eslint-disable */
// =============================================================================
// MonY — servidor (backend) de contas
// -----------------------------------------------------------------------------
// Responsável por: cadastro, login (sessão por token), perfil do usuário,
// foto/avatar, troca de senha, e TROCA DE E-MAIL / TELEFONE COM CÓDIGO
// enviado por e-mail (códigos com validade, uso único e tentativas limitadas).
//
// Rodar:  npm run server        (porta padrão 3333)
// Config: server/.env  (veja server/.env.example — SMTP para envio de e-mails)
// Banco:  server/data/db.json   (arquivo JSON; criado automaticamente)
// =============================================================================
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

// ---------------------------------------------------------------- config (.env)
(function loadEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})();

const PORT = Number(process.env.PORT || 3333);
const CODE_TTL_MS = Number(process.env.CODE_TTL_MINUTES || 10) * 60 * 1000;
const CODE_TTL_OVERRIDE_SECONDS = Number(process.env.CODE_TTL_SECONDS || 0); // só para testes
const CODE_MAX_ATTEMPTS = Number(process.env.CODE_MAX_ATTEMPTS || 5);
const RESEND_COOLDOWN_MS = Number(process.env.RESEND_COOLDOWN_SECONDS || 60) * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;

const DATA_DIR = process.env.MONY_DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.MONY_UPLOAD_DIR || path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------------------------------------------------------------- "banco" JSON
let db = { users: [], sessions: [], verifications: [], loginFails: {} };
if (fs.existsSync(DB_FILE)) {
  try {
    db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (e) {
    console.error('[db] arquivo corrompido, fazendo backup e começando vazio:', e.message);
    fs.copyFileSync(DB_FILE, DB_FILE + '.corrompido-' + Date.now());
  }
}
function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // escrita atômica
}

// ---------------------------------------------------------------- helpers
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const newId = (p) => `${p}_${crypto.randomBytes(9).toString('hex')}`;
const normEmail = (e) => String(e || '').trim().toLowerCase();
const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function checkPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar || null,
    hasPreviousAvatar: !!u.previousAvatar,
    createdAt: u.createdAt,
  };
}

function fail(res, status, error, message, extra = {}) {
  return res.status(status).json({ error, message, ...extra });
}

function maskEmail(e) {
  const [user, domain] = e.split('@');
  const shown = user.length <= 2 ? user[0] : user.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(2, user.length - shown.length))}@${domain}`;
}

function formatPhone(d) {
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

// ---------------------------------------------------------------- e-mail
let transporter = null;
const MAIL_MODE = process.env.SMTP_HOST ? 'smtp' : 'console';
if (MAIL_MODE === 'smtp') {
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}
const MAIL_FROM = process.env.MAIL_FROM || `MonY <${process.env.SMTP_USER || 'nao-responda@mony.app'}>`;

function codeEmailHtml(title, intro, code, minutes) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:24px auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e3ebe6">
    <div style="font-size:22px;font-weight:800;color:#1a5532;margin-bottom:16px">Mon<span style="color:#2b7088">Y</span></div>
    <h2 style="margin:0 0 8px;color:#16241b;font-size:18px">${title}</h2>
    <p style="color:#4b5a51;font-size:14px;line-height:20px">${intro}</p>
    <div style="font-size:32px;letter-spacing:8px;font-weight:800;color:#1a5532;background:#eef7f1;border-radius:12px;text-align:center;padding:16px;margin:18px 0">${code}</div>
    <p style="color:#6b7a71;font-size:12px;line-height:18px">O código vale por ${minutes} minutos e só pode ser usado uma vez.
    Se você não pediu essa alteração, ignore este e-mail — nada será alterado na sua conta.</p>
  </div></body></html>`;
}

async function sendCodeEmail(to, subject, title, intro, code) {
  const minutes = CODE_TTL_OVERRIDE_SECONDS ? (CODE_TTL_OVERRIDE_SECONDS / 60).toFixed(1) : CODE_TTL_MS / 60000;
  if (MAIL_MODE === 'smtp') {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      text: `${title}\n\n${intro}\n\nCódigo: ${code}\n\nVálido por ${minutes} minutos.`,
      html: codeEmailHtml(title, intro, code, minutes),
    });
    return;
  }
  // Modo desenvolvimento (SMTP não configurado): o e-mail NÃO é enviado.
  // O código aparece só aqui, no terminal do servidor.
  console.log('\n┌──────────── E-MAIL (modo desenvolvimento, SMTP não configurado) ────────────');
  console.log(`│ Para:    ${to}`);
  console.log(`│ Assunto: ${subject}`);
  console.log(`│ CÓDIGO:  ${code}`);
  console.log('└──────────────────────────────────────────────────────────────────────────────\n');
}

// ---------------------------------------------------------------- verificação
function createVerification(userId, purpose, newValue) {
  const now = Date.now();
  const last = db.verifications
    .filter((v) => v.userId === userId && v.purpose === purpose)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (last && now - last.createdAt < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now - last.createdAt)) / 1000);
    return { error: { status: 429, code: 'COOLDOWN', message: `Aguarde ${retryAfter}s para pedir um novo código.`, retryAfter } };
  }
  // invalida códigos anteriores do mesmo tipo
  db.verifications.forEach((v) => {
    if (v.userId === userId && v.purpose === purpose && !v.usedAt) {
      v.usedAt = now;
      v.invalidated = true;
    }
  });
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const ttl = CODE_TTL_OVERRIDE_SECONDS ? CODE_TTL_OVERRIDE_SECONDS * 1000 : CODE_TTL_MS;
  const v = {
    id: newId('ver'),
    userId,
    purpose, // 'phone' | 'email' | 'reset'
    newValue,
    codeHash: sha256(code),
    attempts: 0,
    maxAttempts: CODE_MAX_ATTEMPTS,
    createdAt: now,
    expiresAt: now + ttl,
    usedAt: null,
  };
  db.verifications.push(v);
  // limpeza de registros velhos
  db.verifications = db.verifications.filter((x) => now - x.createdAt < 24 * 60 * 60 * 1000);
  save();
  return { verification: v, code };
}

function checkVerification(v, code) {
  const now = Date.now();
  if (!v || v.usedAt) return { status: 400, code: 'INVALID', message: 'Este código não é mais válido. Peça um novo código.' };
  if (now > v.expiresAt) return { status: 410, code: 'EXPIRED', message: 'O código expirou. Peça um novo código.' };
  if (v.attempts >= v.maxAttempts) return { status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Muitas tentativas erradas. Peça um novo código.' };
  v.attempts += 1;
  const ok = crypto.timingSafeEqual(Buffer.from(sha256(String(code || '').trim())), Buffer.from(v.codeHash));
  if (!ok) {
    const left = v.maxAttempts - v.attempts;
    save();
    if (left <= 0) return { status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Muitas tentativas erradas. Peça um novo código.' };
    return { status: 400, code: 'WRONG_CODE', message: `Código incorreto. Você ainda tem ${left} tentativa${left > 1 ? 's' : ''}.`, attemptsLeft: left };
  }
  v.usedAt = now; // uso único
  return null;
}

// ---------------------------------------------------------------- app
const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// autenticação por token (Authorization: Bearer <token>)
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return fail(res, 401, 'UNAUTHENTICATED', 'Faça login para continuar.');
  const s = db.sessions.find((x) => x.tokenHash === sha256(token));
  if (!s || Date.now() > s.expiresAt) return fail(res, 401, 'UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.');
  const user = db.users.find((u) => u.id === s.userId);
  if (!user) return fail(res, 401, 'UNAUTHENTICATED', 'Conta não encontrada.');
  req.user = user;
  req.session = s;
  next();
}

app.get('/api/health', (req, res) => res.json({ ok: true, mail: MAIL_MODE }));

// ---- cadastro (NÃO faz login: o app manda para a tela de login)
app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normEmail(req.body.email);
  const phone = onlyDigits(req.body.phone);
  const password = String(req.body.password || '');
  if (name.length < 2) return fail(res, 400, 'INVALID_NAME', 'Informe seu nome.');
  if (!isEmail(email)) return fail(res, 400, 'INVALID_EMAIL', 'E-mail inválido.');
  if (phone && (phone.length < 10 || phone.length > 11)) return fail(res, 400, 'INVALID_PHONE', 'Telefone inválido.');
  if (password.length < 6) return fail(res, 400, 'WEAK_PASSWORD', 'A senha precisa ter pelo menos 6 caracteres.');
  if (db.users.some((u) => u.email === email)) return fail(res, 409, 'EMAIL_TAKEN', 'Já existe uma conta com esse e-mail.');
  const user = {
    id: newId('usr'),
    name,
    email,
    phone: phone ? formatPhone(phone) : '',
    passwordHash: hashPassword(password),
    avatar: { type: 'initials', value: '0' },
    previousAvatar: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save();
  res.status(201).json({ ok: true, email: user.email });
});

// ---- login
app.post('/api/auth/login', (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || '');
  const lock = db.loginFails[email];
  if (lock && lock.count >= LOGIN_MAX_FAILS && Date.now() - lock.last < LOGIN_LOCK_MS) {
    const min = Math.ceil((LOGIN_LOCK_MS - (Date.now() - lock.last)) / 60000);
    return fail(res, 429, 'LOCKED', `Muitas tentativas. Tente novamente em ${min} min ou redefina a senha.`);
  }
  const user = db.users.find((u) => u.email === email);
  if (!user || !checkPassword(password, user.passwordHash)) {
    const cur = db.loginFails[email] && Date.now() - db.loginFails[email].last < LOGIN_LOCK_MS ? db.loginFails[email] : { count: 0 };
    db.loginFails[email] = { count: cur.count + 1, last: Date.now() };
    save();
    return fail(res, 401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
  }
  delete db.loginFails[email];
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({ id: newId('ses'), userId: user.id, tokenHash: sha256(token), createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
  db.sessions = db.sessions.filter((s) => s.expiresAt > Date.now());
  save();
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/logout', auth, (req, res) => {
  db.sessions = db.sessions.filter((s) => s.id !== req.session.id);
  save();
  res.json({ ok: true });
});

// ---- perfil do usuário logado
app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.patch('/api/me', auth, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2) return fail(res, 400, 'INVALID_NAME', 'Informe seu nome.');
  req.user.name = name;
  save();
  res.json({ user: publicUser(req.user) });
});

// ---- senha
app.post('/api/me/password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!checkPassword(String(currentPassword || ''), req.user.passwordHash)) return fail(res, 400, 'WRONG_PASSWORD', 'Senha atual incorreta.');
  if (String(newPassword || '').length < 6) return fail(res, 400, 'WEAK_PASSWORD', 'A nova senha precisa ter pelo menos 6 caracteres.');
  req.user.passwordHash = hashPassword(String(newPassword));
  // encerra as outras sessões por segurança
  db.sessions = db.sessions.filter((s) => s.userId !== req.user.id || s.id === req.session.id);
  save();
  res.json({ ok: true });
});

// ---- avatar / foto
function removeUploadIfUnused(avatar) {
  if (!avatar || avatar.type !== 'photo') return;
  const stillUsed = db.users.some((u) => (u.avatar && u.avatar.value === avatar.value) || (u.previousAvatar && u.previousAvatar.value === avatar.value));
  if (stillUsed) return;
  const file = path.join(UPLOAD_DIR, path.basename(avatar.value));
  fs.promises.unlink(file).catch(() => {});
}

app.put('/api/me/avatar', auth, (req, res) => {
  const { type, value, base64, mime } = req.body || {};
  let next;
  if (type === 'preset' || type === 'initials') {
    if (!/^[a-z0-9_-]{1,30}$/i.test(String(value || ''))) return fail(res, 400, 'INVALID_AVATAR', 'Avatar inválido.');
    next = { type, value: String(value) };
  } else if (type === 'custom') {
    if (!/^[a-z0-9.\-]{1,200}$/i.test(String(value || ''))) return fail(res, 400, 'INVALID_AVATAR', 'Avatar inválido.');
    next = { type: 'custom', value: String(value) };
  } else if (type === 'photo') {
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const clean = String(base64 || '').replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(clean, 'base64');
    if (buf.length < 100) return fail(res, 400, 'INVALID_IMAGE', 'Imagem inválida.');
    if (buf.length > 5 * 1024 * 1024) return fail(res, 413, 'IMAGE_TOO_BIG', 'A imagem é muito grande (máx. 5 MB).');
    const name = `${req.user.id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    next = { type: 'photo', value: `/uploads/${name}` };
  } else {
    return fail(res, 400, 'INVALID_AVATAR', 'Tipo de avatar inválido.');
  }
  const older = req.user.previousAvatar;
  req.user.previousAvatar = req.user.avatar || null;
  req.user.avatar = next;
  save();
  removeUploadIfUnused(older);
  res.json({ user: publicUser(req.user) });
});

app.post('/api/me/avatar/restore', auth, (req, res) => {
  if (!req.user.previousAvatar) return fail(res, 400, 'NO_PREVIOUS', 'Não há avatar anterior para restaurar.');
  const cur = req.user.avatar;
  req.user.avatar = req.user.previousAvatar;
  req.user.previousAvatar = cur;
  save();
  res.json({ user: publicUser(req.user) });
});

// ---- troca de TELEFONE: código vai para o e-mail ATUAL
app.post('/api/me/phone/request', auth, async (req, res) => {
  const digits = onlyDigits(req.body.newPhone);
  if (digits.length < 10 || digits.length > 11) return fail(res, 400, 'INVALID_PHONE', 'Informe um telefone válido com DDD.');
  const newPhone = formatPhone(digits);
  if (newPhone === req.user.phone) return fail(res, 400, 'SAME_VALUE', 'Esse já é o seu telefone atual.');
  const r = createVerification(req.user.id, 'phone', newPhone);
  if (r.error) return fail(res, r.error.status, r.error.code, r.error.message, { retryAfter: r.error.retryAfter });
  try {
    await sendCodeEmail(req.user.email, 'MonY — código para alterar seu telefone', 'Alteração de telefone',
      `Recebemos um pedido para alterar o telefone da sua conta MonY para <b>${newPhone}</b>. Use o código abaixo para confirmar:`, r.code);
  } catch (e) {
    r.verification.usedAt = Date.now();
    save();
    console.error('[mail] falha ao enviar:', e.message);
    return fail(res, 502, 'MAIL_FAILED', 'Não foi possível enviar o e-mail agora. Tente novamente mais tarde.');
  }
  res.json({ verificationId: r.verification.id, sentTo: maskEmail(req.user.email), expiresAt: r.verification.expiresAt, delivery: MAIL_MODE });
});

app.post('/api/me/phone/confirm', auth, (req, res) => {
  const v = db.verifications.find((x) => x.id === req.body.verificationId && x.userId === req.user.id && x.purpose === 'phone');
  const err = checkVerification(v, req.body.code);
  if (err) { save(); return fail(res, err.status, err.code, err.message, { attemptsLeft: err.attemptsLeft }); }
  req.user.phone = v.newValue; // só altera DEPOIS da verificação
  save();
  res.json({ user: publicUser(req.user) });
});

// ---- troca de E-MAIL: código vai para o NOVO e-mail
app.post('/api/me/email/request', auth, async (req, res) => {
  const newEmail = normEmail(req.body.newEmail);
  if (!isEmail(newEmail)) return fail(res, 400, 'INVALID_EMAIL', 'Informe um e-mail válido.');
  if (newEmail === req.user.email) return fail(res, 400, 'SAME_VALUE', 'Esse já é o seu e-mail atual.');
  if (db.users.some((u) => u.email === newEmail)) return fail(res, 409, 'EMAIL_TAKEN', 'Esse e-mail já está em uso por outra conta.');
  const r = createVerification(req.user.id, 'email', newEmail);
  if (r.error) return fail(res, r.error.status, r.error.code, r.error.message, { retryAfter: r.error.retryAfter });
  try {
    await sendCodeEmail(newEmail, 'MonY — confirme seu novo e-mail', 'Confirme seu novo e-mail',
      `Você pediu para usar este endereço na sua conta MonY. Para confirmar que ele é seu, use o código:`, r.code);
  } catch (e) {
    r.verification.usedAt = Date.now();
    save();
    console.error('[mail] falha ao enviar:', e.message);
    return fail(res, 502, 'MAIL_FAILED', 'Não foi possível enviar o e-mail agora. Verifique o endereço e tente novamente.');
  }
  res.json({ verificationId: r.verification.id, sentTo: maskEmail(newEmail), expiresAt: r.verification.expiresAt, delivery: MAIL_MODE });
});

app.post('/api/me/email/confirm', auth, (req, res) => {
  const v = db.verifications.find((x) => x.id === req.body.verificationId && x.userId === req.user.id && x.purpose === 'email');
  const err = checkVerification(v, req.body.code);
  if (err) { save(); return fail(res, err.status, err.code, err.message, { attemptsLeft: err.attemptsLeft }); }
  if (db.users.some((u) => u.email === v.newValue && u.id !== req.user.id)) {
    save();
    return fail(res, 409, 'EMAIL_TAKEN', 'Esse e-mail passou a ser usado por outra conta.');
  }
  req.user.email = v.newValue;
  save();
  res.json({ user: publicUser(req.user) });
});

// ---- esqueci a senha: código para o e-mail da conta
app.post('/api/auth/password-reset/request', async (req, res) => {
  const email = normEmail(req.body.email);
  if (!isEmail(email)) return fail(res, 400, 'INVALID_EMAIL', 'Informe um e-mail válido.');
  const user = db.users.find((u) => u.email === email);
  // resposta igual exista ou não a conta (não revela quem tem cadastro)
  const generic = { ok: true, sentTo: maskEmail(email), delivery: MAIL_MODE };
  if (!user) return res.json(generic);
  const r = createVerification(user.id, 'reset', null);
  if (r.error) return fail(res, r.error.status, r.error.code, r.error.message, { retryAfter: r.error.retryAfter });
  try {
    await sendCodeEmail(user.email, 'MonY — código para redefinir sua senha', 'Redefinição de senha',
      'Recebemos um pedido para redefinir a senha da sua conta MonY. Use o código abaixo:', r.code);
  } catch (e) {
    r.verification.usedAt = Date.now();
    save();
    console.error('[mail] falha ao enviar:', e.message);
    return fail(res, 502, 'MAIL_FAILED', 'Não foi possível enviar o e-mail agora. Tente novamente mais tarde.');
  }
  res.json(generic);
});

app.post('/api/auth/password-reset/confirm', (req, res) => {
  const email = normEmail(req.body.email);
  const user = db.users.find((u) => u.email === email);
  const v = user && db.verifications
    .filter((x) => x.userId === user.id && x.purpose === 'reset' && !x.usedAt)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (String(req.body.newPassword || '').length < 6) return fail(res, 400, 'WEAK_PASSWORD', 'A nova senha precisa ter pelo menos 6 caracteres.');
  const err = checkVerification(v, req.body.code);
  if (err) { save(); return fail(res, err.status, err.code, err.message, { attemptsLeft: err.attemptsLeft }); }
  user.passwordHash = hashPassword(String(req.body.newPassword));
  db.sessions = db.sessions.filter((s) => s.userId !== user.id); // derruba sessões antigas
  delete db.loginFails[email];
  save();
  res.json({ ok: true });
});

app.use((req, res) => fail(res, 404, 'NOT_FOUND', 'Rota não encontrada.'));
app.use((err, req, res, next) => {
  console.error(err);
  fail(res, 500, 'SERVER_ERROR', 'Erro inesperado no servidor.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nMonY servidor rodando em http://localhost:${PORT}`);
  console.log(
    MAIL_MODE === 'smtp'
      ? `E-mails: SMTP ${process.env.SMTP_HOST} (envio real)`
      : 'E-mails: SMTP NÃO configurado → modo desenvolvimento (os códigos aparecem aqui no terminal, nenhum e-mail é enviado). Veja server/.env.example'
  );
});
