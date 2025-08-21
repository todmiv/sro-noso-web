// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Основной плагин для React (HMR, Fast Refresh)
  plugins: [react()],

  // Настройки для разработческого сервера
  server: {
    // Порт, на котором запускается dev-сервер
    port: 3000,
    // Открыть браузер при запуске
    open: true,
    // Хост для прослушивания (0.0.0.0 для доступа с других устройств в сети)
    // host: '0.0.0.0',
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
