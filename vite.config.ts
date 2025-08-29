// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  // Основной плагин для React (HMR, Fast Refresh)
  plugins: [
    react(),
    {
      name: 'html-history-api-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          console.log(`Handling request: ${req.url}`);
          // Пропускаем статические файлы и системные запросы
          if (
            req.url?.includes('.') || 
            req.url?.startsWith('/@') || 
            req.url?.startsWith('/__') ||
            req.url === '/favicon.ico'
          ) {
            return next();
          }
          
          // Для всех остальных запросов отдаем index.html
          const indexPath = path.join(process.cwd(), 'public', 'index.html');
      if (!fs.existsSync(indexPath)) {
        console.error(`Index file not found at: ${indexPath}`);
        res.statusCode = 500;
        return res.end('Missing index.html');
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
          res.end(fs.readFileSync(indexPath, 'utf-8'));
        });
      }
    }
  ],

  // Настройки для разработческого сервера
  server: {
    // Смена порта для обхода возможных конфликтов
    port: 5173,
    // Открыть браузер при запуске
    open: true,
    // Разрешить подключение с любых локальных интерфейсов
    host: '0.0.0.0',
    // Явно отключаем strict cors для локальной разработки
    strictPort: true,
  },

  // Настройки для сборки (production)
  build: {
    // Директория для выходных файлов сборки
    outDir: 'dist',
    // Директория для статических ресурсов (относительно outDir)
    assetsDir: 'assets',
    // Минификация кода (включена по умолчанию для production)
    // minify: 'esbuild', // или 'terser'
    // Исходные карты (полезны для отладки в production)
    sourcemap: true, // Можно установить в false для production, если не нужно
  },

  // Настройки для разрешения импортов
  resolve: {
  // Псевдонимы для путей (alias)
  alias: {
    // Создаем псевдоним '@' для директории src
    // Это позволяет использовать импорты вроде '@/components/ui/Button'
    '@': path.resolve(__dirname, './src'),
  },
  },

  // Настройки CSS
  css: {
    // PostCSS конфигурация (для Tailwind CSS)
    postcss: './postcss.config.js',
  },
});
