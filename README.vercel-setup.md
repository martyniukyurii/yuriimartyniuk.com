# Розгортання на Vercel

Сайт і Telegram-бот розгортаються одним Next.js-проєктом.

1. Підключи репозиторій у Vercel.
2. Додай `MONGODB_URI`, `SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_ID`, `TELEGRAM_CHANNEL_ID`, `TELEGRAM_WEBHOOK_SECRET`. Інші функції сайту, наприклад контактна форма, мають власні змінні з `.env.example`.
3. Розгорни сайт звичайною production-збіркою.
4. Після доступності production URL виконай `node scripts/setup-telegram-bot.mjs` з локальним `.env.local`.
5. Виконай `/template`, `/new`, надішли тестовий HTML і фото, потім `/publish` у тестовий канал.

Постійний процес та cron більше не потрібні. Докладний сценарій, ліміти медіа та відновлення часткових публікацій: [README.telegram-setup.md](README.telegram-setup.md).

Не вмикай webhook на preview URL, якщо не хочеш перенаправити production-бота на preview. Для preview використовуй окремого бота, канал і базу.
