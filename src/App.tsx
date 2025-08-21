// src/App.tsx

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css'; // Глобальные стили приложения (если нужны)

// === Импорт компонентов макета ===
import Header from './components/layout/Header';
// import Footer from './components/layout/Footer'; // Пока не реализован

// === Импорт страниц ===
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import DocumentsPage from './pages/DocumentsPage';
import AskAIPage from './pages/AskAIPage';
import HelpPage from './pages/HelpPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage'; // Страница 404

// === Импорт контекста аутентификации ===
// import { useAuth } from './hooks/useAuth'; // Будет создан позже
// import { AuthProvider } from './context/AuthContext'; // Будет создан позже

// === Импорт утилит и хуков ===
import { useLocalStorage } from './hooks/useLocalStorage'; // Будет создан позже

const App: React.FC = () => {
  // === Получение текущего местоположения для SEO ===
  const location = useLocation();

  // === Обработка баннера о локальном хранилище (пункт 6 ТЗ, пункт 8 обсуждения) ===
  const [bannerClosed, setBannerClosed] = useLocalStorage<boolean>('idb_banner_closed', false);

  // Функция для закрытия баннера
  const handleCloseBanner = () => {
    setBannerClosed(true);
  };

  // === Эффект для SEO (React Helmet Async - будет добавлен позже) ===
  // useEffect(() => {
  //   // Здесь будет логика для установки title и meta description в зависимости от location.pathname
  // }, [location]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900"> {/* Основной контейнер приложения */}
      
      {/* Баннер о локальном хранилище (пункт 6 ТЗ, пункт 8 обсуждения) */}
      {/* Показываем баннер, если он еще не был закрыт пользователем */}
      {!bannerClosed && (
        <div className="bg-blue-100 border-b border-blue-200 px-4 py-3 text-blue-800 flex justify-between items-center">
          <span>
            Мы используем локальное хранилище для сохранения настроек и истории чата. Продолжая, вы соглашаетесь с <a href="/privacy" className="underline hover:text-blue-600">Политикой конфиденциальности</a>.
          </span>
          <button
            onClick={handleCloseBanner}
            className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Закрыть уведомление"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Шапка сайта */}
      <Header />

      {/* Основное содержимое */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Роутинг приложения */}
        <Routes>
          {/* Главная страница */}
          <Route path="/" element={<HomePage />} />

          {/* Профиль (требует аутентификации) */}
          {/* <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} /> */}
          {/* Для MVP временно делаем доступным для всех, чтобы можно было проверить */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Каталог документов */}
          <Route path="/documents" element={<DocumentsPage />} />

          {/* ИИ-консультант */}
          <Route path="/ask-ai" element={<AskAIPage />} />

          {/* Помощь и обратная связь */}
          <Route path="/help" element={<HelpPage />} />

          {/* Политика конфиденциальности */}
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Редирект со старого URL /help на новый /help, если нужно */}
          {/* <Route path="/help-old" element={<Navigate to="/help" replace />} /> */}

          {/* Страница 404 - должна быть последней */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Подвал сайта */}
      {/* <Footer /> */}

      {/* Уведомления (Toasts) - будут реализованы позже */}
      {/* <ToastContainer /> */}

    </div>
  );
};

export default App;

// === Вспомогательный компонент PrivateRoute (будет доработан) ===
// const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // const { isAuthenticated } = useAuth(); // Получаем состояние аутентификации
//   const isAuthenticated = false; // Заглушка

//   // Если пользователь аутентифицирован, показываем children, иначе перенаправляем на логин
//   return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
// };
