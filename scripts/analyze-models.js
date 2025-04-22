const fs = require('fs');
const path = require('path');
const THREE = require('three');
// Потрібно імпортувати GLTFLoader у Node.js
require('three/examples/js/loaders/GLTFLoader');

const modelsDir = path.join(__dirname, '../public/3D_models');
const files = fs.readdirSync(modelsDir).filter(file => file.endsWith('.glb'));

console.log('Аналіз 3D моделей:');

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const fileSize = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n=== ${file} (${fileSize} MB) ===`);
  
  // Тут би використали GLTFLoader, але це складно зробити в Node.js без додаткових пакетів
  // Тому виводимо тільки базову інформацію про розмір файлу
});

console.log('\nДля детального аналізу 3D моделей рекомендуємо використати:');
console.log('1. https://gltf-viewer.donmccurdy.com/ - онлайн-переглядач для GLB/GLTF');
console.log('2. https://gltf.report/ - детальний аналіз структури моделей');
console.log('3. Blender - відкрити моделі і подивитись їхню структуру візуально'); 