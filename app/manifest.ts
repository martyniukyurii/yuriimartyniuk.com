import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Юрій Мартинюк - Full Stack Developer',
    short_name: 'Юрій Мартинюк',
    description: 'Персональний сайт Юрія Мартинюка - Full Stack розробника з досвідом 5+ років.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020817',
    theme_color: '#020817',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
} 