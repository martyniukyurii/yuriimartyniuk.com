# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).

# Сайт Юрія Мартинюка

## Налаштування відправки повідомлень з форми контактів

Для правильної роботи форми зворотного зв'язку потрібно налаштувати сервіс Resend:

### 1. Створення акаунту Resend

1. Зареєструйтеся на [Resend](https://resend.com) та увійдіть в акаунт.
2. Створіть API ключ у розділі "API Keys". Скопіюйте його.
3. Вставте API ключ у файл `.env.local` в корені проекту:
   ```
   RESEND_API_KEY=re_ваш_ключ_тут
   ```

### 2. Налаштування домену (важливо!)

1. У Resend перейдіть до розділу "Domains".
2. Додайте та підтвердіть ваш домен, наприклад `yuriimartyniuk.com`.
3. Після підтвердження домену, змініть параметр `from` у файлі `app/api/contact/route.ts`:
   ```javascript
   from: 'Форма контактів <noreply@yuriimartyniuk.com>',
   ```
   
### 3. Тестування

На етапі тестування можна використовувати домен за замовчуванням:
```javascript
from: 'Форма контактів <onboarding@resend.dev>',
```

Але майте на увазі, що з доменом за замовчуванням можна надсилати електронні листи лише на підтверджені адреси у вашому акаунті Resend!

### 4. Можливі проблеми

Якщо листи не надходять, перевірте:

1. Правильність API ключа у файлі `.env.local`
2. Чи підтверджений ваш домен (якщо використовуєте власний)
3. Якщо використовуєте тестовий домен (`onboarding@resend.dev`), переконайтеся, що адреса отримувача підтверджена у вашому акаунті Resend
4. Перевірте логи у консолі та на сервері для детальної інформації про помилки

### 5. Альтернативний варіант

Якщо не вдається налаштувати Resend, можна використати інші сервіси відправки пошти:
- SendGrid
- Mailgun
- Amazon SES
- Formspree (не потребує бекенду)

## Запуск проекту

```bash
# Встановлення залежностей
npm install

# Запуск у режимі розробки
npm run dev

# Збірка проекту
npm run build

# Запуск збірки
npm start
```

# Екстрактор посилань

Цей скрипт витягує всі URL-посилання з текстового файлу та зберігає їх у новому файлі.

## Використання

```bash
python extract_links.py <вхідний_файл> <вихідний_файл>
```

Де:
- `<вхідний_файл>` - шлях до файлу з текстом, який містить посилання
- `<вихідний_файл>` - шлях до файлу, в який будуть збережені знайдені посилання

## Приклад

```bash
python extract_links.py input.txt links.txt
```

## Що розпізнає скрипт

Скрипт шукає URL-посилання, що починаються з:
- http://
- https://
- www.

Кожне знайдене посилання зберігається в окремому рядку вихідного файлу.
