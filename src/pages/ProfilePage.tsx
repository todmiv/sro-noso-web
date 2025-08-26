// src/pages/ProfilePage.tsx

import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Для навигации после входа
// import { useAuth } from '../hooks/useAuth'; // Будет создан позже
// import { verifyINN } from '../services/authService'; // Будет создан позже
import { isValidINN } from '../utils/helpers'; // Будет создан позже

const ProfilePage: React.FC = () => {
  // === Состояние аутентификации (заглушка) ===
  // const { isAuthenticated, user, login } = useAuth();
  const isAuthenticated = false; // Заглушка
  // const user = { 
  //   inn: "1234567890", 
  //   full_name: "ООО 'СтройГарант'", 
  //   membership_exp: new Date('2025-12-31'), 
  //   role: 'member' 
  // }; // Заглушка
  // const navigate = useNavigate();

  // === Состояние формы входа ===
  const [inn, setInn] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // const [attempts, setAttempts] = useState<number>(0); // Для ограничения попыток

  // === Состояние для отображения секции членства ===
  // const [membershipStatus, setMembershipStatus] = useState<'active' | 'expiring' | 'expired' | 'excluded' | null>(null);
  // const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  // === Обработчик изменения ИНН ===
  const handleInnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Удаляем все нецифровые символы
    if (value.length <= 12) {
      setInn(value);
      if (error && isValidINN(value)) {
        setError(null); // Скрываем ошибку, если ИНН стал валидным
      }
    }
  };

  // === Обработчик отправки формы входа ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidINN(inn)) {
      setError('ИНН должен содержать 10 или 12 цифр.');
      return;
    }

    // Ограничение попыток (заглушка)
    // if (attempts >= 5) {
    //   setError('Превышено максимальное количество попыток. Попробуйте позже.');
    //   return;
    // }

    setIsLoading(true);
    try {
      // const userData = await verifyINN(inn); // Вызов сервиса проверки ИНН
      // await login(userData); // Авторизация пользователя
      // setAttempts(0); // Сброс счетчика попыток при успехе
      // navigate('/profile'); // Перенаправление на профиль (или остаемся на той же странице, если она и есть профиль)
      
      // Заглушка для демонстрации
      console.log("Попытка входа с ИНН:", inn);
      // Имитируем задержку
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Для демонстрации считаем, что вход успешен
      alert(`Вход успешен для ИНН: ${inn}`);
      // Здесь должна быть логика обновления состояния аутентификации
      
    } catch (err: any) {
      console.error("Ошибка входа:", err);
      // setAttempts(prev => prev + 1); // Увеличиваем счетчик попыток
      
      // Определяем тип ошибки и устанавливаем сообщение
      if (err.message === 'INN_NOT_FOUND') {
        setError('ИНН не обнаружен в реестре СРО НОСО. Проверьте правильность или обратитесь в поддержку: support@sro-noso.ru');
      } else if (err.message === 'STATUS_EXCLUDED') {
        setError('Организация исключена из реестра. Для восстановления членства обратитесь в СРО.');
      } else if (err.message === 'SERVICE_UNAVAILABLE') {
        setError('Проверка временно недоступна, попробуйте через минуту.');
      } else {
        setError('Произошла ошибка при входе. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // === Эффект для вычисления статуса членства (заглушка) ===
  // useEffect(() => {
  //   if (isAuthenticated && user?.membership_exp) {
  //     const expDate = new Date(user.membership_exp);
  //     const today = new Date();
  //     const diffTime = expDate.getTime() - today.getTime();
  //     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  //     if (diffDays > 90) {
  //       setMembershipStatus('active');
  //     } else if (diffDays > 0) {
  //       setMembershipStatus('expiring');
  //       setDaysUntilExpiry(diffDays);
  //     } else {
  //       setMembershipStatus('expired');
  //     }
  //     // Статус 'excluded' должен приходить из user.role или отдельного поля
  //   }
  // }, [isAuthenticated, user]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">
        {isAuthenticated ? 'Профиль' : 'Вход для членов СРО НОСО'}
      </h1>

      {!isAuthenticated ? (
        // === Форма входа по ИНН ===
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-700 mb-4">
            Введите ИНН вашей организации или ИП для входа в личный кабинет:
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inn" className="block text-sm font-medium text-gray-700 mb-1">
                ИНН
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="inn"
                value={inn}
                onChange={handleInnChange}
                placeholder="1234567890"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                aria-describedby={error ? "inn-error" : undefined}
              />
              {error && (
                <p id="inn-error" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <button
                type="submit"
                disabled={isLoading || !isValidINN(inn)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                  isLoading || !isValidINN(inn)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Проверка...
                  </span>
                ) : (
                  'Войти'
                )}
              </button>
              
              {/* Кнопка "Попробовать снова" появляется при ошибке */}
              {error && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    // setAttempts(0); // Сброс счетчика попыток
                  }}
                  className="ml-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Попробовать снова
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        // === Информация профиля (после входа) ===
        <div className="space-y-6">
          
          {/* Информация пользователя */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Информация профиля</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ИНН</p>
                <p className="font-medium">{/*user?.inn || 'Не указан'*/}1234567890</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Организация</p>
                <p className="font-medium">{/*user?.full_name || 'Не указана'*/}ООО "СтройГарант"</p>
              </div>
              
              {/* <div>
                <p className="text-sm text-gray-500">Email для восстановления</p>
                <p className="font-medium">{user?.recovery_email || 'Не указан'} <button className="text-sm text-primary hover:underline">[Изменить]</button></p>
              </div> */}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                // onClick={handleLogout} // Функция выхода
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Статус членства (сценарий 2.5) */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Статус членства</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Действующий</span>
                <span className="ml-2 text-sm text-gray-600">Действует до 31 декабря 2025</span>
              </div>
              
              <p className="text-sm text-gray-600">
                Осталось: <span className="font-medium">120 дней</span>
              </p>
              
              {/* Кнопка "Продлить членство" появляется за 90 дней до окончания */}
              {/* {membershipStatus === 'expiring' && daysUntilExpiry !== null && daysUntilExpiry <= 90 && (
                <a
                  href="mailto:members@sro-noso.ru?subject=Продление+членства"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                  Продлить членство
                </a>
              )} */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
