// src/pages/HomePage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth'; // Будет создан позже

const HomePage: React.FC = () => {
  // === Состояние аутентификации (заглушка) ===
  // const { isAuthenticated, user } = useAuth();
  const isAuthenticated = false; // Заглушка
  // const user = { full_name: "Иван Иванов" }; // Заглушка

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Приветствие */}
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
        {isAuthenticated ? `Добро пожаловать, ${/*user?.full_name ||*/ 'Пользователь'}!` : 'Добро пожаловать на платформу СРО НОСО'}
      </h1>

      {/* Описание */}
      <p className="text-lg text-gray-700 mb-8 max-w-2xl">
        {isAuthenticated
          ? 'Здесь вы можете получить доступ к документам, задать вопросы ИИ-консультанту и управлять своим профилем.'
          : 'Платформа для членов СРО НОСО. Авторизуйтесь по ИНН, чтобы получить полный доступ к документам и ИИ-консультанту.'}
      </p>

      {/* Основные действия / Навигация */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <Link
          to="/documents"
          className="px-6 py-3 bg-white border border-primary text-primary font-medium rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          Каталог документов
        </Link>
        <Link
          to="/ask-ai"
          className="px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          Задать вопрос ИИ
        </Link>
      </div>

      {/* Призыв к действию для гостей */}
      {!isAuthenticated && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100 max-w-2xl">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Для членов СРО</h2>
          <p className="text-blue-700 mb-4">
            Авторизуйтесь по ИНН, чтобы получить полный доступ ко всем функциям платформы.
          </p>
          <Link
            to="/profile" // Для MVP ведем на профиль, где будет форма входа
            className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Войти по ИНН
          </Link>
        </div>
      )}

      {/* Дополнительная информация (можно расширить) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg mb-2 text-primary">Документы</h3>
          <p className="text-gray-600">
            Доступ к актуальным нормативным документам и рекомендациям СРО.
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg mb-2 text-primary">ИИ-консультант</h3>
          <p className="text-gray-600">
            Получите быстрые ответы на вопросы по документации с помощью искусственного интеллекта.
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg mb-2 text-primary">Профиль</h3>
          <p className="text-gray-600">
            Управление данными членства и персональными настройками.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
