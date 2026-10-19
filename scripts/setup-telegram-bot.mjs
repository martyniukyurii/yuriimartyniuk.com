import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const origin = process.env.SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
if (!token || !secret || !origin || !process.env.TELEGRAM_OWNER_ID || !process.env.TELEGRAM_CHANNEL_ID) {
  throw new Error('Configure MONGODB_URI, SITE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_OWNER_ID and TELEGRAM_CHANNEL_ID first.');
}
if (!/^[A-Za-z0-9_-]{32,256}$/.test(secret)) throw new Error('Webhook secret must contain 32–256 letters, digits, underscores or hyphens.');
const url = new URL('/api/telegram/webhook', origin);
if (url.protocol !== 'https:') throw new Error('The deployed webhook must use HTTPS.');

async function call(method, payload) {
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
    });
  } catch { throw new Error('Telegram connection failed. Credentials were not logged.'); }
  const json = await response.json();
  if (!json.ok) throw new Error(`Telegram rejected ${method} (code ${json.error_code}).`);
  return json.result;
}

await call('setMyCommands', { commands: [
  { command: 'template', description: 'Шаблон і промпт для LLM' },
  { command: 'new', description: 'Нова чернетка статті' },
  { command: 'posts', description: 'Редагувати або видалити статті' },
  { command: 'publish', description: 'Опублікувати на сайті та в каналі' },
] });
await call('setWebhook', { url: url.toString(), secret_token: secret, allowed_updates: ['message', 'callback_query'], max_connections: 1 });
const info = await call('getWebhookInfo', {});
if (info.url !== url.toString()) throw new Error('Webhook URL verification failed.');
console.log(`Webhook registered: ${url.origin}${url.pathname}. Pending updates: ${info.pending_update_count}.`);
