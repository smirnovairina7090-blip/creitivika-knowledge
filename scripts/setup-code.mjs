import { createHash, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
const prompt = createInterface({input:process.stdin, output:process.stdout});
const code = (await prompt.question('Код команды для методиста: ')).trim();
prompt.close();
if (code.length < 12 || code.length > 128) throw new Error('Используйте от 12 до 128 символов.');
console.log('Добавьте две переменные в настройки проекта Netlify (Functions):');
console.log('KB_EDITOR_CODE_HASH=' + createHash('sha256').update(code).digest('hex'));
console.log('KB_SESSION_SECRET=' + randomBytes(48).toString('hex'));
