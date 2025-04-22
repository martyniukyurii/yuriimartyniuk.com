import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Ініціалізуємо Resend з API ключем
const resendApiKey = process.env.RESEND_API_KEY;

// Перевіряємо наявність API ключа
if (!resendApiKey) {
  console.error('RESEND_API_KEY не вказаний в .env файлі');
}

const resend = new Resend(resendApiKey);

// Адреса, на яку надсилатимуться повідомлення
const toEmail = 'yura.martin.1993@gmail.com';

export async function POST(request: Request) {
  try {
    // Отримуємо дані з форми
    const data = await request.json();
    const { name, email, message } = data;

    // Проста валідація
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Заповніть всі поля форми' },
        { status: 400 }
      );
    }

    console.log(`Спроба надіслати лист до ${toEmail}`);

    // Відправляємо email через Resend
    const result = await resend.emails.send({
      from: 'Форма контактів <contact@mediamood.today>', // Стандартна адреса для тестування
      to: toEmail,
      subject: `Нове повідомлення від ${name}`,
      html: `
        <h2>Нове повідомлення з вашого сайту</h2>
        <p><strong>Ім'я:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Повідомлення:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `Нове повідомлення з вашого сайту\n\nІм'я: ${name}\nEmail: ${email}\n\nПовідомлення:\n${message}`,
    });

    console.log('Відповідь від Resend:', result);

    // Повертаємо успішну відповідь
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Детальна помилка при надсиланні повідомлення:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
    
    return NextResponse.json(
      { 
        error: 'Не вдалося відправити повідомлення', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
} 