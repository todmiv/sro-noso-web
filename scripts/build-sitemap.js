// scripts/build-sitemap.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname в ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Базовый URL вашего сайта (замените на реальный перед продакшеном)
// В идеале, это должно браться из переменной окружения, например, process.env.SITE_URL
// Для MVP оставим так, но учтите это на будущее.
const baseUrl = process.env.SITE_URL || 'https://your-username.github.io/sro-noso-web';

// Список маршрутов (routes) вашего приложения
// Убедитесь, что они соответствуют реальным путям, определенным в вашем роутере (App.tsx)
const routes = [
  '/',
  '/documents',
  '/ask-ai',
  '/help',
  '/privacy'
  // Добавьте сюда другие маршруты, если они появятся
];

// Функция для форматирования даты в формате W3C (ISO 8601) для <lastmod>
const getLastModifiedDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Формат: YYYY-MM-DD
};

// Генерация XML-контента sitemap
const generateSitemapXml = (urls) => {
  const lastmod = getLastModifiedDate();
  const urlsXml = urls.map(urlObj => 
    `  <url>\n    <loc>${urlObj.loc}</loc>\n    <lastmod>${urlObj.lastmod}</lastmod>\n    <changefreq>${urlObj.changefreq || 'daily'}</changefreq>\n    <priority>${urlObj.priority || '0.7'}</priority>\n  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
};

// Основная функция
const buildSitemap = () => {
  // Путь к директории dist относительно корня проекта
  const distPath = path.resolve(__dirname, '../dist');
  
  // Проверяем, существует ли директория dist
  if (!fs.existsSync(distPath)) {
    console.error(`Ошибка: Директория ${distPath} не найдена. Пожалуйста, сначала выполните сборку проекта (npm run build).`);
    process.exit(1);
  }

  // Подготавливаем список URL объектов с loc, lastmod и другими опциональными полями
  const urlObjects = routes.map(route => ({
    loc: `${baseUrl}${route === '/' ? '' : route}`, // Убираем слэш для главной страницы, если нужно
    lastmod: getLastModifiedDate(), // Можно сделать более точным, если у вас есть дата изменения для конкретной страницы
    changefreq: 'daily', // Частота изменения (daily, weekly, monthly и т.д.)
    priority: route === '/' ? '1.0' : '0.8' // Приоритет главной страницы выше
  }));

  // Генерируем XML
  const sitemapXml = generateSitemapXml(urlObjects);

  // Путь к файлу sitemap.xml внутри dist
  const sitemapPath = path.join(distPath, 'sitemap.xml');

  // Записываем файл
  fs.writeFileSync(sitemapPath, sitemapXml);

  console.log(`✅ Sitemap успешно сгенерирован и сохранен в ${sitemapPath}`);
};

// Запуск скрипта
buildSitemap();
