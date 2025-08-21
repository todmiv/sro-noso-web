/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0057B8',   // Основной цвет из ТЗ
        accent: '#16A34A',    // Акцентный цвет из ТЗ
        text: '#111827',      // Цвет текста из ТЗ
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Шрифт Inter из ТЗ
      },
    },
  },
  plugins: [],
}
