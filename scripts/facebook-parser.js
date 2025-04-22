const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Конфігурація
const OUTPUT_DIR = path.join(__dirname, 'output');
const LINKS_FILE = path.join(__dirname, '../test_links.txt');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'facebook_posts.json');
const DELAY_BETWEEN_REQUESTS = 2000; // затримка між запитами у мілісекундах

/**
 * Головна функція для парсингу Facebook постів
 */
async function main() {
  console.log('Початок парсингу постів Facebook...');
  
  try {
    // Створюємо вихідну директорію, якщо вона не існує
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Зчитуємо посилання з файлу
    const links = await readLinks();
    console.log(`Знайдено ${links.length} посилань для обробки`);
    
    // Запускаємо браузер
    const browser = await puppeteer.launch({
      headless: 'new', // використовуємо новий headless режим для кращої продуктивності
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const results = [];
    
    // Обробляємо кожне посилання
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`Обробка посилання ${i + 1}/${links.length}: ${link}`);
      
      try {
        const postData = await scrapePost(browser, link);
        results.push(postData);
        console.log(`✅ Успішно оброблено: ${link}`);
      } catch (error) {
        console.error(`❌ Помилка обробки ${link}: ${error.message}`);
        // Додаємо запис з помилкою
        results.push({
          url: link,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Додаємо затримку між запитами
      if (i < links.length - 1) {
        console.log(`Затримка ${DELAY_BETWEEN_REQUESTS / 1000} секунд...`);
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    }
    
    // Зберігаємо результати у JSON файл
    await fs.writeFile(OUTPUT_JSON, JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ Результати збережено у файл: ${OUTPUT_JSON}`);
    
    // Закриваємо браузер
    await browser.close();
    console.log('Браузер закрито');
    
  } catch (error) {
    console.error(`Критична помилка: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Зчитує список посилань з файлу
 */
async function readLinks() {
  try {
    const content = await fs.readFile(LINKS_FILE, 'utf8');
    const links = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('facebook.com') && !line.startsWith('#'));
    
    return [...new Set(links)]; // видаляємо дублікати
  } catch (error) {
    throw new Error(`Помилка при зчитуванні файлу з посиланнями: ${error.message}`);
  }
}

/**
 * Парсить дані з Facebook посту
 */
async function scrapePost(browser, url) {
  const page = await browser.newPage();
  
  try {
    // Налаштування для прискорення завантаження сторінки
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
        req.continue();
      } else if (req.resourceType() === 'script') {
        req.continue();
      } else {
        req.continue();
      }
    });
    
    // Встановлюємо user-agent, щоб виглядати як звичайний браузер
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    
    // Завантажуємо сторінку
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Закриваємо діалоги cookie, якщо вони з'являються
    try {
      const cookieButton = await page.$('button[data-cookiebanner="accept_button"]');
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Ігноруємо помилки з діалогом cookie
    }
    
    // Збираємо дані
    const postData = await page.evaluate(() => {
      const result = {
        url: window.location.href,
        author: '',
        text: '',
        images: [],
        videos: [],
        timestamp: new Date().toISOString()
      };
      
      // Витягуємо автора
      const authorElement = document.querySelector('a[role="link"][tabindex="0"][aria-hidden="false"] > strong');
      if (authorElement) {
        result.author = authorElement.textContent.trim();
      }
      
      // Витягуємо текст посту
      const contentElements = document.querySelectorAll('div[data-ad-preview="message"] > div, div[dir="auto"][style*="text-align"]');
      if (contentElements && contentElements.length > 0) {
        // Беремо найдовший текст (скоріше за все він і є основним вмістом)
        let maxText = '';
        contentElements.forEach(el => {
          const text = el.textContent.trim();
          if (text.length > maxText.length) {
            maxText = text;
          }
        });
        result.text = maxText;
      }
      
      // Витягуємо зображення
      const imageElements = document.querySelectorAll('a[role="link"] img[src^="https://scontent"], div[role="button"] img[src^="https://scontent"]');
      if (imageElements && imageElements.length > 0) {
        imageElements.forEach(img => {
          // Перевіряємо, що це не аватар чи іконка
          const rect = img.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 100) {
            result.images.push(img.src);
          }
        });
      }
      
      // Витягуємо відео
      const videoElements = document.querySelectorAll('video');
      if (videoElements && videoElements.length > 0) {
        videoElements.forEach(video => {
          if (video.src) {
            result.videos.push(video.src);
          } else if (video.querySelector('source')) {
            result.videos.push(video.querySelector('source').src);
          }
        });
      }
      
      return result;
    });
    
    return postData;
  } finally {
    await page.close();
  }
}

/**
 * Функція для затримки
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Запускаємо основну функцію
main().catch(console.error); 