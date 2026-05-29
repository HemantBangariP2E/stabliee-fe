import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ menu_button: { type: 'commands' } }),
});
const data = await res.json();
if (!data.ok) {
  console.error(data.description || data);
  process.exit(1);
}
console.log('Menu button set to commands (no Mini App).');
