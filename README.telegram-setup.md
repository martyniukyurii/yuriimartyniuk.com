# Налаштування парсера Telegram каналу

Цей документ містить інструкції з налаштування парсера Telegram каналу для імпорту даних у блог.

## Передумови

1. Node.js 16+ та npm
2. MongoDB (локальний або хмарний)
3. Доступ до Telegram API (API ID та API Hash)

## Отримання API ID та API Hash

1. Відвідайте https://my.telegram.org
2. Увійдіть у свій аккаунт Telegram
3. Перейдіть до розділу "API development tools"
4. Створіть новий додаток, заповнивши необхідні поля
5. Після створення ви отримаєте `api_id` та `api_hash`

## Отримання Session Key

Для отримання session key, потрібно виконати наступні кроки:

1. Створіть тимчасовий файл `get-session.js` з таким вмістом:

```js
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;

(async () => {
  console.log("Запуск отримання сесії...");
  
  const stringSession = new StringSession("");
  const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
    connectionRetries: 5,
  });
  
  await client.start({
    phoneNumber: async () => await input.text("Введіть номер телефону: "),
    password: async () => await input.text("Введіть пароль 2FA (якщо є): "),
    phoneCode: async () => await input.text("Введіть код, отриманий в Telegram: "),
    onError: (err) => console.log(err),
  });
  
  console.log("Ви успішно підключилися!");
  console.log("Ключ сесії (TELEGRAM_SESSION_KEY):", client.session.save());
  
  await client.disconnect();
})();
```

2. Встановіть необхідні пакети: `npm install telegram input`
3. Запустіть скрипт з передачею змінних середовища:
   ```
   TELEGRAM_API_ID=your_api_id TELEGRAM_API_HASH=your_api_hash node get-session.js
   ```
4. Дотримуйтесь інструкцій, введіть номер телефону та код підтвердження
5. Скопіюйте отриманий session key, він виглядає як довгий рядок символів

## Налаштування змінних середовища

Створіть файл `.env.local` на основі `.env.local.example` і заповніть наступні змінні:

```
MONGODB_URI=mongodb://localhost:27017/blog
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_KEY=your_session_key
TELEGRAM_CHANNEL_USERNAME=@your_channel
```

Де:
- `MONGODB_URI` - URI підключення до MongoDB
- `TELEGRAM_API_ID` - API ID з my.telegram.org
- `TELEGRAM_API_HASH` - API Hash з my.telegram.org
- `TELEGRAM_SESSION_KEY` - Ключ сесії, отриманий на попередньому кроці
- `TELEGRAM_CHANNEL_USERNAME` - Ім'я користувача каналу з символом @ спереду (наприклад, @mychannel)

## Запуск парсера

### Одноразовий запуск

```bash
npx tsx scripts/telegram-parser.ts
```

### Налаштування запуску за розкладом

Для запуску парсера за розкладом ви можете використовувати cron або інші планувальники завдань. Наприклад, для запуску щохвилини:

#### Cron (Linux/Mac)

```bash
* * * * * cd /path/to/your/project && npx tsx scripts/telegram-parser.ts >> /tmp/telegram-parser.log 2>&1
```

#### Windows Task Scheduler

Створіть bat-файл `run-parser.bat`:

```bat
cd /d "C:\path\to\your\project"
npx tsx scripts/telegram-parser.ts
```

І налаштуйте запуск цього файлу через Windows Task Scheduler.

## Вирішення проблем

### Помилка авторизації

Якщо ви отримуєте помилку авторизації, спробуйте згенерувати новий ключ сесії, виконавши ще раз кроки з розділу "Отримання Session Key".

### Проблеми з підключенням до Telegram API

Переконайтесь, що ваш IP не заблокований Telegram. Спробуйте використовувати VPN, якщо необхідно.

### Помилки доступу до каналу

Переконайтесь, що акаунт, з яким ви створили сесію, має доступ до вказаного каналу. 