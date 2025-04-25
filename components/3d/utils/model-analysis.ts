import * as THREE from 'three';

// Типи для налаштувань 3D-моделей
export interface ModelSettings {
  scale: number;        // Коефіцієнт масштабування
  position: {           // Позиція моделі
    x: number;
    y: number;
    z: number;
  };
  rotation: {           // Поворот моделі (в радіанах)
    x: number;
    y: number;
    z: number;
  };
  animation?: {         // Налаштування анімації
    enabled: boolean;   // Чи увімкнена анімація
    speed: number;      // Швидкість обертання
    bounce: number;     // Амплітуда "підстрибування"
  };
}

// Тип моделі для списку моделей
export interface ModelConfig {
  path: string;         // Шлях до файлу моделі
  name: string;         // Назва моделі
  settings: ModelSettings; // Налаштування
}

// Функція для аналізу 3D-моделі та створення рекомендованих налаштувань
export function analyzeModel(scene: THREE.Group): ModelSettings {
  // Створюємо обмежувальну коробку
  const box = new THREE.Box3().setFromObject(scene);
  
  // Отримуємо розміри і центр
  const size = new THREE.Vector3();
  box.getSize(size);
  
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  // Знаходимо найбільший розмір
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Визначаємо основну вісь моделі
  const mainAxis = size.x >= size.y && size.x >= size.z ? 'x' : 
                   size.y >= size.x && size.y >= size.z ? 'y' : 'z';
                   
  // Визначаємо пропорції моделі
  const aspectRatio = {
    xy: size.x / size.y,
    xz: size.x / size.z,
    yz: size.y / size.z
  };
  
  // Визначаємо базове масштабування (залежно від найбільшого розміру)
  let baseScale = 2 / maxDim;
  
  // Обмежуємо масштаб мінімальним і максимальним значенням
  baseScale = Math.min(Math.max(baseScale, 0.001), 20);
  
  // Визначаємо потрібні зміщення для центрування
  const offset = {
    x: -center.x,
    y: -center.y,
    z: -center.z
  };
  
  // Визначаємо, чи потрібен поворот
  const rotation = { x: 0, y: 0, z: 0 };
  
  // Аналіз на основі розмірів і форми
  if (mainAxis === 'y') {
    // Вертикально орієнтована модель
    if (aspectRatio.xy > 2) {
      // Дуже висока і тонка
      rotation.x = 0.1;  // Трохи нахилимо, щоб було видно
    }
  } else if (mainAxis === 'x') {
    // Горизонтально орієнтована модель
    if (aspectRatio.xy > 2) {
      // Дуже широка
      rotation.y = 0.2;  // Повернемо для кращого огляду
    }
  } else if (mainAxis === 'z') {
    // Модель витягнута вперед
    rotation.y = 0.4;  // Повернемо для кращого огляду з різних сторін
  }
  
  // Швидкість обертання залежно від розміру - маленькі об'єкти обертаються швидше
  const rotationSpeed = Math.min(0.015, 0.005 + 1 / maxDim * 0.1);
  
  // Амплітуда підстрибування залежить від типу моделі
  const bounce = mainAxis === 'y' ? 0.2 : 0.05;
  
  // Повертаємо рекомендовані налаштування
  return {
    scale: baseScale,
    position: offset,
    rotation: rotation,
    animation: {
      enabled: true,
      speed: rotationSpeed,
      bounce: bounce
    }
  };
}

// Попередньо налаштовані моделі, які ви можете скопіювати в AutoFitModel
export const PRESET_MODELS: Record<string, ModelSettings> = {
  'chess_piece_knight_horse.glb': {
    scale: 2.5,
    position: { x: 0, y: -0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    animation: { enabled: true, speed: 0.01, bounce: 0.2 }
  },
  'chess_piece_queen.glb': {
    scale: 2.5,
    position: { x: 0, y: -0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    animation: { enabled: true, speed: 0.01, bounce: 0.2 }
  },
  'bicycle.glb': {
    scale: 0.03,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0.5, z: 0 },
    animation: { enabled: true, speed: 0.01, bounce: 0 }
  },
  'origami_unicorn.glb': {
    scale: 4,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0.8, z: 0 },
    animation: { enabled: true, speed: 0.01, bounce: 0.1 }
  },
  'macbook_laptop.glb': {
    scale: 4,
    position: { x: 0, y: -1, z: 0 },
    rotation: { x: 0.3, y: 0.5, z: 0 },
    animation: { enabled: true, speed: 0.01, bounce: 0 }
  }
};

// Функція для отримання налаштувань моделі за її назвою
export function getModelSettings(modelPath: string): ModelSettings {
  // Отримуємо ім'я файлу з шляху
  const fileName = modelPath.split('/').pop() || '';
  
  // Шукаємо в пресетах
  if (fileName in PRESET_MODELS) {
    return PRESET_MODELS[fileName];
  }
  
  // Шукаємо за частиною імені
  for (const key in PRESET_MODELS) {
    if (fileName.includes(key) || key.includes(fileName)) {
      return PRESET_MODELS[key];
    }
  }
  
  // За типом моделі
  if (fileName.includes('chess')) {
    return PRESET_MODELS['chess_piece_knight_horse.glb'];
  }
  
  // Стандартні налаштування, якщо нічого не знайдено
  return {
    scale: 10,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    animation: {
      enabled: true,
      speed: 0.01,
      bounce: 0.5
    }
  };
} 