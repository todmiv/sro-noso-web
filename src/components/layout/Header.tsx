// src/components/layout/Header.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth'; // Будет создан позже
// import { useNavigate } from 'react-router-dom'; // Для навигации при выходе

const Header: React.FC = () => {
  // === Получение текущего местоположения для активных ссылок ===
  const location = useLocation();
  
  // === Состояние аутентификации (заглушка) ===
  // const { isAuthenticated, user, logout } = useAuth();
  const isAuthenticated = false; // Заглушка
  // const user = { full_name: "Иван Иванов" }; // Заглушка
  // const navigate = useNavigate();

  // === Обработчик выхода (заглушка) ===
  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     navigate('/'); // Перенаправляем на главную после выхода
  //   } catch (err) {
  //     console.error("Ошибка выхода:", err);
  //     // Можно показать toast с ошибкой
  //   }
  // };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50"> {/* Фиксированная шапка с тенью */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Логотип / Название сайта */}
          <Link to="/" className="flex items-center space-x-2">
            {/* Если будет логотип, добавить тут <img src="/logo.svg" alt="СРО НОСО" className="h-8 w-auto" /> */}
            <span className="text-xl font-bold text-primary">СРО НОСО</span>
          </Link>

          {/* Навигация (для десктопа) */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              to="/documents" 
              className={`hover:text-primary ${location.pathname === '/documents' ? 'font-semibold text-primary' : 'text-gray-600'}`}
            >
              Документы
            </Link>
            <Link 
              to="/ask-ai" 
              className={`hover:text-primary ${location.pathname === '/ask-ai' ? 'font-semibold text-primary' : 'text-gray-600'}`}
            >
              ИИ-консультант
            </Link>
            {/* <Link 
              to="/help" 
              className={`hover:text-primary ${location.pathname === '/help' ? 'font-semibold text-primary' : 'text-gray-600'}`}
            >
              Помощь
            </Link> */}
          </nav>

          {/* Кнопка профиля / Войти */}
          <div>
            {isAuthenticated ? (
              // Если пользователь авторизован
              <div className="relative group">
                {/* Кнопка с именем пользователя или ИНН */}
                <button
                  // onClick={handleProfileClick} // Открытие меню профиля
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {/* <span className="sr-only">Открыть меню пользователя</span> */}
                  {/* Иконка пользователя или аватар */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {/* {user?.full_name?.charAt(0) || 'П'} */}
                    П
                  </div>
                  <span className="ml-2 hidden md:inline">Профиль</span> {/* Показываем имя только на десктопе */}
                </button>

                {/* Выпадающее меню профиля (пока скрыто) */}
                {/* <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                  <div className="py-1" role="none">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Профиль</Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Выйти
                    </button>
                  </div>
                </div> */}
              </div>
            ) : (
              // Если пользователь не авторизован
              <Link
                to="/profile" // Для MVP временно ведем на профиль, где будет форма входа
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
