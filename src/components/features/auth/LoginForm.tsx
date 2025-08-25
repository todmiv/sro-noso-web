// src/components/features/auth/LoginForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { isValidINN } from '../../../utils/helpers';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Toast from '../../ui/Toast';

/**
 * Компонент формы входа по ИНН.
 *
 * Реализует сценарий 2.1 из ТЗ: ввод ИНН, проверка через Edge Function,
 * создание/обновление пользователя и авторизация.
 */

const LoginForm: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const [inn, setInn] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Обработчик изменения ввода ИНН
  const handleInnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Оставляем только цифры
    if (value.length <= 12) { // Ограничиваем длину
      setInn(value);
    }
  };

  // Функция для показа Toast
  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    // Клиентская валидация
    if (!inn) {
      setLocalError('Пожалуйста, введите ИНН.');
      return;
    }

    if (!isValidINN(inn)) {
      setLocalError('Неверный формат ИНН. ИНН должен состоять из 10 или 12 цифр.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(inn);
      if (success) {
        showToastMessage('Вы успешно вошли в систему!', 'success');
        // Сброс формы
        setInn('');
      } else {
        // Ошибка будет в authError, обработана ниже
      }
    } catch (err) {
      // Ошибки логируются и устанавливаются в контексте
      console.error('Unexpected error in LoginForm:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Эффект для обработки ошибок из контекста
  useEffect(() => {
    if (authError) {
      showToastMessage(authError, 'error');
    }
  }, [authError, showToastMessage]);

  // Эффект для автофокуса на поле ввода
  useEffect(() => {
    const inputElement = document.getElementById('inn-input');
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-md">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в личный кабинет
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Введите ИНН вашей организации или ИП
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="inn" className="block text-sm font-medium text-gray-700">
            ИНН
          </label>
          <div className="mt-1">
            <Input
              id="inn-input"
              name="inn"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              value={inn}
              onChange={handleInnChange}
              placeholder="10 или 12 цифр"
              disabled={isLoading}
              maxLength={12}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              ИНН состоит из 10 цифр (для юридических лиц) или 12 цифр (для физических лиц)
            </p>
          </div>
        </div>

        {(localError || authError) && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {localError || authError}
                </h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Проверка...
              </>
            ) : (
              'Войти'
            )}
          </Button>
        </div>
      </form>

      {/* Toast для отображения сообщений */}
      {showToast && (
        <Toast
          toast={{
            id: 'login-toast',
            type: toastType,
            description: toastMessage,
          }}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default LoginForm;
