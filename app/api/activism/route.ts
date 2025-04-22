import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { 
  ActivismPost, 
  ActivismInitiative, 
  ActivismStat, 
  CategoryStat,
  ActivismApiResponse 
} from '@/types/mongodb';

// Конфігурація MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const MONGODB_DB = process.env.MONGODB_DB || 'yuriimartyniuk';
const MONGODB_COLLECTION = 'activism';

export async function GET() {
  console.log('API route /api/activism запущено');
  
  try {
    console.log('Підключення до MongoDB:', MONGODB_URI);
    
    // Перевіримо, чи є змінні оточення
    if (!process.env.MONGODB_URI) {
      console.warn('УВАГА: MONGODB_URI не встановлено в змінних оточення, використовуємо значення за замовчуванням');
    }
    
    // Підключення до MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Успішно підключено до MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ActivismPost>(MONGODB_COLLECTION);
    
    // Перевіримо наявність колекції
    const collections = await db.listCollections({ name: MONGODB_COLLECTION }).toArray();
    if (collections.length === 0) {
      console.error(`Колекція '${MONGODB_COLLECTION}' не знайдена в базі даних`);
      return NextResponse.json({
        success: false,
        error: `Колекція '${MONGODB_COLLECTION}' не знайдена в базі даних`
      }, { status: 404 });
    }
    
    // Отримуємо дані про активізм з MongoDB
    const totalPosts = await collection.countDocuments();
    console.log(`Знайдено ${totalPosts} записів у колекції`);
    
    if (totalPosts === 0) {
      // Якщо записів немає, повертаємо демо-дані
      console.log('Немає даних, повертаємо демо-дані');
      return NextResponse.json(getDemoData());
    }
    
    // Отримуємо дані про активізм з MongoDB
    const activismPosts = await collection.find({}).limit(10).toArray();
    console.log(`Отримано ${activismPosts.length} постів з MongoDB`);
    
    // Статистика по категоріях активізму
    const statsQuery = [
      {
        $unwind: '$activism_categories'
      },
      {
        $group: {
          _id: '$activism_categories',
          count: { $sum: 1 }
        }
      }
    ];
    
    const categoryStats = await collection.aggregate(statsQuery).toArray();
    console.log(`Отримано ${categoryStats.length} категорій активізму`);
    
    // Статистичні дані
    const postsWithImages = await collection.countDocuments({ 'media_counts.images': { $gt: 0 } });
    const postsWithVideos = await collection.countDocuments({ 'media_counts.videos': { $gt: 0 } });
    
    // Підготовка даних статистики
    const stats: ActivismStat[] = [
      { id: 1, label: "Ініціативи", value: `${totalPosts}+` },
      { id: 2, label: "Категорії", value: `${categoryStats.length}` },
      { id: 3, label: "Пости з зображеннями", value: `${postsWithImages}` },
      { id: 4, label: "Пости з відео", value: `${postsWithVideos}` }
    ];
    
    // Трансформуємо дані для відображення
    const initiatives: ActivismInitiative[] = activismPosts.map((post, index) => {
      // Витягуємо дату з тексту або використовуємо дату обробки
      let dateMatch = post.text.match(/(\d{1,2}[\s.,-]\d{1,2}[\s.,-]\d{2,4})/);
      let date = dateMatch ? dateMatch[0] : new Date(post.timestamp || post.processed_at).toLocaleDateString('uk-UA');
      
      // Витягуємо локацію з тексту або встановлюємо значення за замовчуванням
      let locationMatch = post.text.match(/м[\s.]\s*([А-ЯІЇЄҐа-яіїєґ']+)/i);
      let location = locationMatch ? locationMatch[1] : "Україна";
      
      // Перебір категорій для кращого відображення
      const categories = post.activism_categories ? post.activism_categories.join(', ') : '';
      
      return {
        id: index + 1,
        title: post.text.split('.')[0] || 'Ініціатива активізму',
        description: post.text.substring(0, 200) + (post.text.length > 200 ? '...' : ''),
        date: date,
        location: location,
        categories: categories,
        author: post.author || 'Активіст',
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : 'https://via.placeholder.com/600x400',
        videoUrl: post.videos && post.videos.length > 0 ? post.videos[0] : '',
        url: post.url || ''
      };
    });
    
    // Закриваємо з'єднання з MongoDB
    await client.close();
    console.log("MongoDB connection closed");
    
    // Повертаємо дані
    const response: ActivismApiResponse = { 
      success: true, 
      initiatives, 
      stats,
      categoryStats: categoryStats.map(stat => ({
        category: stat._id,
        count: stat.count
      }))
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Помилка при отриманні даних про активізм:', error);
    
    // Повертаємо демо-дані в разі помилки
    console.log('Повертаємо демо-дані через помилку');
    return NextResponse.json(getDemoData());
  }
}

// Функція для отримання демо-даних, якщо MongoDB недоступний
function getDemoData(): ActivismApiResponse {
  const demoStats: ActivismStat[] = [
    { id: 1, label: "Ініціативи", value: "50+" },
    { id: 2, label: "Категорії", value: "6" },
    { id: 3, label: "Пости з зображеннями", value: "42" },
    { id: 4, label: "Пости з відео", value: "11" }
  ];
  
  const demoCategoryStats: CategoryStat[] = [
    { category: "волонтерський", count: 46 },
    { category: "освітній", count: 38 },
    { category: "соціальний", count: 23 },
    { category: "цифровий", count: 34 },
    { category: "політичний", count: 12 },
    { category: "екологічний", count: 4 }
  ];
  
  const demoInitiatives: ActivismInitiative[] = [
    {
      id: 1,
      title: "Запрошуємо долучитися до волонтерської ініціативи",
      description: "Збираємо кошти на допомогу дітям, які постраждали від війни. Кожна гривня важлива. Разом ми можемо зробити більше!",
      date: "01.05.2023",
      location: "Чернівці",
      categories: "волонтерський, соціальний",
      author: "Андрій Гевюк",
      imageUrl: "https://via.placeholder.com/600x400",
      url: "https://www.facebook.com/agevyuk"
    },
    {
      id: 2,
      title: "Кібербезпека для всіх",
      description: "Освітній курс з кібербезпеки для всіх бажаючих. Навчимо основам захисту інформації, безпечному використанню інтернету та захисту від фішингу.",
      date: "15.06.2023",
      location: "Україна",
      categories: "освітній, цифровий",
      author: "Фонд Символи",
      imageUrl: "https://via.placeholder.com/600x400",
      url: "https://www.facebook.com/fsymvoly"
    },
    {
      id: 3,
      title: "Екологічний проект CleanCity",
      description: "Ініціатива із прибирання міських парків та популяризації сортування сміття серед мешканців міста.",
      date: "10.07.2023",
      location: "Київ",
      categories: "екологічний, соціальний",
      author: "Активіст",
      imageUrl: "https://via.placeholder.com/600x400",
      url: ""
    }
  ];
  
  return {
    success: true,
    initiatives: demoInitiatives,
    stats: demoStats,
    categoryStats: demoCategoryStats
  };
} 