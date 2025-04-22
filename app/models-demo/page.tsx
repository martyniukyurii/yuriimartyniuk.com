"use client";

import React from "react";
import SimplifiedModelViewer from "@/components/3d/SimplifiedModelViewer";

// Список всіх наших моделей
const MODELS = [
  {
    name: "Шаховий кінь",
    path: "/3D_models/chess_piece_knight_horse.glb",
    description: "Шахова фігура коня, класичний дизайн",
    fitOffset: 1.5
  },
  {
    name: "Королева",
    path: "/3D_models/chess_piece_queen.glb",
    description: "Шахова фігура королеви з тонкими деталями",
    fitOffset: 1.5
  },
  {
    name: "Велосипед",
    path: "/3D_models/bicycle.glb",
    description: "Детальна модель велосипеда з рухомими частинами",
    fitOffset: 1.2
  },
  {
    name: "Макбук",
    path: "/3D_models/macbook_laptop.glb",
    description: "Модель ноутбука MacBook з відкритим екраном",
    fitOffset: 1.3
  },
  {
    name: "Орігамі єдиноріг",
    path: "/3D_models/origami_unicorn.glb",
    description: "Паперова фігурка єдинорога в стилі орігамі",
    fitOffset: 1.4
  },
];

export default function ModelDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Демонстрація 3D-моделей</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Новий метод відображення 3D-моделей</h2>
        <p className="text-gray-700">
          Тепер використовується компонент SimplifiedModelViewer, який автоматично підлаштовує розмір
          та позицію камери під будь-яку 3D-модель. Кожна модель точно вміщується в рамки свого контейнера.
        </p>
      </div>
      
      {/* Сітка моделей */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODELS.map((model) => (
          <div 
            key={model.path} 
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Заголовок картки */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
              <h2 className="text-xl font-semibold text-white">{model.name}</h2>
            </div>
            
            {/* Контейнер для 3D-моделі */}
            <div className="h-80 bg-gray-100">
              <SimplifiedModelViewer
                modelPath={model.path}
                autoRotate={true}
                backgroundColor="transparent"
                fitOffset={model.fitOffset}
                environmentPreset="studio"
              />
            </div>
            
            {/* Опис моделі */}
            <div className="p-4">
              <p className="text-gray-600">{model.description}</p>
              <div className="mt-3 text-xs text-gray-400">
                Коефіцієнт відстані: {model.fitOffset}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Приклад налаштувань */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 p-4 bg-indigo-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">Приклади різних налаштувань fitOffset</h2>
          <p className="text-gray-700 mb-4 text-center">
            Параметр fitOffset визначає, наскільки близько камера буде до моделі (менше значення = ближче)
          </p>
        </div>
        
        {/* Різні варіанти відображення однієї моделі */}
        {[0.8, 1.2, 1.6].map((offset) => (
          <div 
            key={offset} 
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-2 bg-indigo-500 text-center">
              <h2 className="font-semibold text-white">fitOffset: {offset}</h2>
            </div>
            
            <div className="h-64 bg-gray-100">
              <SimplifiedModelViewer
                modelPath="/3D_models/bicycle.glb"
                autoRotate={true}
                backgroundColor="transparent"
                fitOffset={offset}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Примітка */}
      <div className="mt-12 p-6 bg-green-50 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Як використовувати на головній сторінці</h2>
        <p className="text-gray-700">
          Просто замініть компонент ModelViewer на SimplifiedModelViewer у будь-якому місці сайту.
          Він автоматично підлаштує камеру під розмір моделі і контейнера, що робить
          відображення коректним на будь-якому екрані.
        </p>
        
        <div className="mt-4 p-4 bg-gray-800 text-white rounded text-left overflow-auto">
          <pre className="text-sm">
{`// Приклад використання
<SimplifiedModelViewer
  modelPath="/3D_models/your_model.glb"
  autoRotate={true}
  fitOffset={1.2} // Ближче до моделі: 0.8-1.0, далі від моделі: 1.3-1.8
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
} 