import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createDatabasePool, migrateDatabase } from './database.mjs';

try {
  if (!/^[a-f0-9]{64}$/i.test(process.env.KB_EDITOR_CODE_HASH || '') ||
      (process.env.KB_SESSION_SECRET || '').length < 32) {
    throw new Error('Задайте KB_EDITOR_CODE_HASH и KB_SESSION_SECRET в настройках приложения.');
  }
  const port = process.env.PORT || '3000';
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Неверное значение PORT.');
  if (process.env.KB_PUBLIC_ORIGIN) {
    const origin = new URL(process.env.KB_PUBLIC_ORIGIN);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== process.env.KB_PUBLIC_ORIGIN) {
      throw new Error('KB_PUBLIC_ORIGIN должен содержать только адрес сайта без пути и завершающего слеша.');
    }
  }
  const pool = createDatabasePool();
  try {
    await migrateDatabase(pool);
  } finally {
    await pool.end();
  }
  console.log('База готова. Запускаем сайт.');
  const child = spawn(process.execPath, [
    fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)),
    'start', '--hostname', '0.0.0.0', '--port', port,
  ], { cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit' });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { console.error('Не удалось запустить сайт.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch (error) {
  // A database error can contain connection details. Do not print those to logs.
  console.error('Запуск остановлен. Проверьте подключение базы и переменные приложения.');
  if (error.code) console.error('Код ошибки:', error.code);
  process.exitCode = 1;
}
