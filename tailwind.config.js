// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Добавляем фирменные цвета из ТЗ (пункт 10)
      colors: {
        'primary': '#0057B8',   // Основной синий
        'accent': '#16A34A',    // Акцент зелёный
        'text-primary': '#111827', // Текст (slate-900 по умолчанию, но зафиксируем)
        // Фон светлой темы #FFFFFF и тёмной #0F172A можно добавить позже при необходимости темизации
      },
      // Шрифт Inter будет подключен через CDN в index.html или установлен как зависимость
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Указываем Inter как основной шрифт sans-serif
      }
    },
  },
  plugins: [],
}
