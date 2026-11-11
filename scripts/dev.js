// Sobe o servidor (backend) e o app Expo juntos, num terminal só.
//   npm run dev        → servidor + Expo (QR code para o celular)
//   npm run dev:web    → servidor + Expo já abrindo no navegador
const { spawn } = require('child_process');
const extra = process.argv.slice(2);
const opts = { stdio: 'inherit', shell: true };

const server = spawn('node', ['server/index.js'], opts);
const expo = spawn('npx', ['expo', 'start', '--offline', ...extra], opts);

const stop = () => {
  server.kill();
  expo.kill();
  process.exit();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => code && console.log(`[servidor] encerrou com código ${code}`));
expo.on('exit', () => stop());
