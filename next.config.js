/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'assets.aceternity.com',
      'scontent.fcwc1-1.fna.fbcdn.net',
      'scontent.fcwc1-2.fna.fbcdn.net',
      'scontent-iad3-1.xx.fbcdn.net',
      'scontent-iad3-2.xx.fbcdn.net',
      'scontent.xx.fbcdn.net',
      'video.fcwc1-1.fna.fbcdn.net',
      'video.fcwc1-2.fna.fbcdn.net',
      'video.xx.fbcdn.net',
      'via.placeholder.com'
    ],
  },
  // Налаштування для коректної роботи з 3D-моделями
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
          name: '[hash].[ext]'
        }
      }
    });
    
    return config;
  },
  // Збільшуємо таймаут для статичних генерацій
  staticPageGenerationTimeout: 180,
  // Оптимізуємо для Vercel
  swcMinify: true,
  // Збираємо статичні моделі
  experimental: {
    largePageDataBytes: 128 * 100000, // Збільшуємо ліміт для великих сторінок
  }
};

module.exports = nextConfig;
