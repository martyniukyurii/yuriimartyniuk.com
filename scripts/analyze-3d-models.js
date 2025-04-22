#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Шлях до директорії з 3D моделями
const modelsDir = path.join(__dirname, '../public/3D_models');

// Функція для форматування розміру файлу
function formatSize(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Отримання списку GLB файлів
function getGlbFiles() {
  try {
    if (!fs.existsSync(modelsDir)) {
      console.error(`Директорія ${modelsDir} не існує.`);
      return [];
    }
    
    const files = fs.readdirSync(modelsDir);
    return files.filter(file => path.extname(file).toLowerCase() === '.glb')
                .map(file => path.join(modelsDir, file));
  } catch (error) {
    console.error(`Помилка при читанні директорії: ${error.message}`);
    return [];
  }
}

// Отримання базової інформації про файл
function getBasicFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    console.error(`Помилка при отриманні інформації про файл ${filePath}: ${error.message}`);
    return null;
  }
}

// Отримання детальної інформації про GLB файл з використанням gltf-validator
function getGlbDetailedInfo(filePath) {
  try {
    // Перевірка, чи встановлено gltf-validator
    try {
      execSync('npx gltf-validator --version', { stdio: 'ignore' });
    } catch (error) {
      console.warn('gltf-validator не встановлено. Встановіть його за допомогою: npm install -g gltf-validator');
      return null;
    }
    
    const output = execSync(`npx gltf-validator "${filePath}" -o detailed`).toString();
    const result = JSON.parse(output);
    
    return {
      validatorInfo: result.info,
      issues: result.issues,
      meshes: result.info.meshes?.count || 0,
      materials: result.info.materials?.count || 0,
      textures: result.info.textures?.count || 0,
      animations: result.info.animations?.count || 0,
      totalErrors: result.issues.numErrors || 0,
      totalWarnings: result.issues.numWarnings || 0,
      totalInfos: result.issues.numInfos || 0,
      totalHints: result.issues.numHints || 0
    };
  } catch (error) {
    console.error(`Помилка при валідації моделі ${filePath}: ${error.message}`);
    return null;
  }
}

// Аналіз моделей
function analyzeModels() {
  const glbFiles = getGlbFiles();
  
  console.log(`\n=== Аналіз 3D моделей ===`);
  console.log(`Знайдено ${glbFiles.length} GLB файлів у директорії ${modelsDir}\n`);
  
  if (glbFiles.length === 0) {
    console.log('Немає GLB файлів для аналізу.');
    return;
  }
  
  glbFiles.forEach(filePath => {
    const basicInfo = getBasicFileInfo(filePath);
    if (!basicInfo) return;
    
    console.log(`\n## Модель: ${basicInfo.name}`);
    console.log(`Розмір: ${basicInfo.sizeFormatted}`);
    console.log(`Створено: ${basicInfo.created.toLocaleString()}`);
    console.log(`Змінено: ${basicInfo.modified.toLocaleString()}`);
    
    const detailedInfo = getGlbDetailedInfo(filePath);
    if (detailedInfo) {
      console.log('\n# Технічна інформація:');
      console.log(`Меші: ${detailedInfo.meshes}`);
      console.log(`Матеріали: ${detailedInfo.materials}`);
      console.log(`Текстури: ${detailedInfo.textures}`);
      console.log(`Анімації: ${detailedInfo.animations}`);
      
      console.log('\n# Результати валідації:');
      console.log(`Помилки: ${detailedInfo.totalErrors}`);
      console.log(`Попередження: ${detailedInfo.totalWarnings}`);
      console.log(`Інформаційні повідомлення: ${detailedInfo.totalInfos}`);
      console.log(`Підказки: ${detailedInfo.totalHints}`);
      
      if (detailedInfo.totalErrors > 0 || detailedInfo.totalWarnings > 0) {
        console.log('\n# Проблеми, що потребують уваги:');
        const allIssues = [
          ...(detailedInfo.issues.errors || []),
          ...(detailedInfo.issues.warnings || [])
        ];
        
        allIssues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.message} (${issue.severity})`);
        });
      }
    }
    
    // Рекомендації щодо оптимізації
    console.log('\n# Рекомендації:');
    if (basicInfo.size > 10 * 1024 * 1024) {
      console.log('- Модель дуже велика. Рекомендується оптимізувати її розмір.');
      console.log('- Зменшіть розмір текстур або використовуйте компресію текстур.');
      console.log('- Спростіть геометрію, зменшіть кількість полігонів.');
    } else if (basicInfo.size > 5 * 1024 * 1024) {
      console.log('- Модель має середній розмір. Можливо, варто розглянути деякі оптимізації.');
      console.log('- Перевірте розмір текстур та розгляньте можливість використання формату DRACO для стиснення геометрії.');
    } else {
      console.log('- Модель має прийнятний розмір. Спеціальна оптимізація може не знадобитись.');
    }
    
    console.log('- Для кращої продуктивності розгляньте можливість використання LOD (рівнів деталізації) для складних моделей.');
    console.log('- Перевірте, чи всі текстури потрібного розміру і формату. WebP або KTX2 можуть значно зменшити розмір файлу.');
    
    console.log('\n------------------------');
  });
}

// Запуск аналізу
analyzeModels(); 