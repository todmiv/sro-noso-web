// src/App.tsx
import React from 'react';
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
import { AuthProvider } from './context/AuthContext'; // Импортируем провайдер

// === Импорт утилит и хуков ===
import useAuth from './hooks/useAuth'; // Импортируем хук
import useLocalStorage from './hooks/useLocalStorage'; // <-- Изменено: без {}

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
    <AuthProvider> {/* Оборачиваем всё приложение в AuthProvider */}
      <div className="flex flex-col min-h-screen bg-white text-slate-900"> {/* Основной контейнер приложения */}
        
        {/* Баннер о локальном хранилище (пункт 6 ТЗ, пункт 8 обсуждения) */}
        {/* Показываем баннер, если он еще не был закрыт пользователем */}
        {!bannerClosed && (
          <div className="bg-blue-100 border-b border-blue-200 px-4 py-3 text-blue-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span>
              Мы используем локальное хранилище для сохранения настроек и истории чата. Продолжая, вы соглашаетесь с <a href="/privacy" className="underline hover:text-blue-600">Политикой конфиденциальности</a>.
            </span>
            <button
              onClick={handleCloseBanner}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
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
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

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
    </AuthProvider>
  );
};

// === Вспомогательный компонент PrivateRoute ===
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth(); // Получаем состояние аутентификации
// ===  const location = useLocation();

  // Пока состояние аутентификации загружается, можно показать спиннер или просто ничего
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Если пользователь аутентифицирован (не гость), показываем children, иначе перенаправляем на главную (или на логин, если будет отдельная страница)
  // Для MVP редирект на главную
  return user && user.role !== 'guest' ? <>{children}</> : <Navigate to="/" replace state={{ from: location }} />;
};

export default App;
