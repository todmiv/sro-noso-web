// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Для навигации
import App from './App.tsx';
import './index.css'; // Импорт основных стилей (включая Tailwind)

// === Инициализация глобальных сервисов ===

// 1. Sentry (Мониторинг ошибок - пункт 5 обсуждения, п. 4 ТЗ)
// Импортируем Sentry
import * as Sentry from "@sentry/react";

// Проверяем, не в режиме ли разработки, чтобы избежать лишних ошибок в консоли локально
if (import.meta.env.MODE !== 'development') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN, // DSN из переменных окружения
    integrations: [
      Sentry.browserTracingIntegration(), // Для трассировки
      Sentry.replayIntegration(), // Для записи сессий (опционально, требует настройки)
    ],
    // Трассировка Performance
    tracesSampleRate: 1.0, // 100% транзакций для трассировки
    // Сессионные записи (Replay)
    replaysSessionSampleRate: 0.1, // 10% сессий
    replaysOnErrorSampleRate: 1.0, // 100% при ошибках
  });
  console.log("✅ Sentry initialized");
} else {
  console.log("ℹ️ Sentry disabled in development mode");
}


// 2. Plausible Analytics (Аналитика - пункт 10 обсуждения, п. 4 ТЗ)
// Plausible подключается через скрипт в index.html, но можно добавить программную инициализацию при необходимости
// import Plausible from 'plausible-tracker';
// const plausible = Plausible({
//   domain: 'your-domain.com', // Замените на ваш домен
//   // apiHost: 'https://plausible.io' // По умолчанию
// });
// plausible.enableAutoPageviews(); // Автоматический трекинг просмотров страниц

// === Рендеринг приложения ===

// 1. Получаем DOM-элемент для монтирования приложения
const container = document.getElementById('root');

// 2. Проверяем, что контейнер существует
if (!container) {
  console.error("❌ Fatal Error: Root container '#root' not found in the DOM.");
  // Можно показать пользователю сообщение об ошибке, если контейнер не найден
} else {
  // 3. Создаем React root и рендерим приложение внутри Router
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      {/* Оборачиваем App в Router для работы с маршрутами */}
      <Router>
        <App />
      </Router>
    </React.StrictMode>,
  );
  console.log("🚀 React app rendered successfully");
}
