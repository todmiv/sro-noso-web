// src/components/features/help/SupportForm.tsx

import React, { useState } from 'react';
// import Button from '../../ui/Button'; // Можно использовать, если нужно
// import Input from '../../ui/Input'; // Можно использовать, если нужно
// import { isValidEmail } from '../../../utils/helpers'; // Будет создан позже

interface SupportFormProps {
  // Предзаполненный email, если пользователь авторизован
  initialEmail?: string;
  // Callback, вызываемый при успешной отправке
  onSubmitSuccess?: () => void;
}

const SupportForm: React.FC<SupportFormProps> = ({ initialEmail = '', onSubmitSuccess }) => {
  // === Состояния формы ===
  const [topic, setTopic] = useState<string>(''); // Выбранный пункт из выпадающего списка
  const [message, setMessage] = useState<string>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [email, setEmail] = useState<string>(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConsentChecked, setIsConsentChecked] = useState<boolean>(false); // Согласие на обработку ПД

  // === Обработчики ===
  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTopic(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка размера файла (до 5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Размер скриншота не должен превышать 5 МБ.');
        e.target.value = ''; // Сбросить выбор файла
        return;
      }
      // Проверка типа файла (изображения)
      if (!file.type.startsWith('image/')) {
        setSubmitError('Пожалуйста, выберите файл изображения (JPG, PNG и т.д.).');
        e.target.value = ''; // Сбросить выбор файла
        return;
      }
      setScreenshot(file);
      setSubmitError(null); // Очистить ошибку, если файл валиден
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsConsentChecked(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Базовая валидация
    if (!topic) {
      setSubmitError('Пожалуйста, выберите тему обращения.');
      return;
    }
    if (!message.trim()) {
      setSubmitError('Пожалуйста, опишите проблему.');
      return;
    }
    if (!isConsentChecked) {
      setSubmitError('Необходимо согласие на обработку персональных данных.');
      return;
    }
    // Валидация email, если он введен
    // if (email && !isValidEmail(email)) {
    //   setSubmitError('Пожалуйста, введите корректный email.');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      // const formData = new FormData();
      // formData.append('topic', topic);
      // formData.append('message', message);
      // if (screenshot) formData.append('screenshot', screenshot);
      // if (email) formData.append('email', email); // Отправляем email, если указан

      // await submitSupportTicket(formData); // Вызов сервиса отправки тикета (будет создан позже)
      
      // Имитация отправки
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Тикет отправлен:", { topic, message, email, screenshot: screenshot?.name });

      // Сброс формы и показ успеха
      setTopic('');
      setMessage('');
      setScreenshot(null);
      // setEmail(''); // Не сбрасываем email, если он предзаполнен
      setIsConsentChecked(false);
      setSubmitSuccess(true);
      
      // Вызов callback при успехе
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Автоматически скрыть сообщение успеха через 5 секунд
      setTimeout(() => setSubmitSuccess(false), 5000);

    } catch (err) {
      console.error("Ошибка при отправке тикета:", err);
      setSubmitError('Не удалось отправить сообщение. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
      {/* Сообщение об успешной отправке */}
      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <p>✅ Спасибо! Ваше сообщение отправлено. Мы ответим в течение 1 рабочего дня.</p>
        </div>
      )}

      {/* Тема обращения */}
      <div>
        <label htmlFor="help-topic" className="block text-sm font-medium text-gray-700 mb-1">
          Тема обращения <span className="text-red-500">*</span>
        </label>
        <select
          id="help-topic"
          value={topic}
          onChange={handleTopicChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={isSubmitting}
        >
          <option value="">Выберите тему...</option>
          <option value="bug_bot">Ошибка ИИ-консультанта</option>
          <option value="bug_document">Ошибка в документе</option>
          <option value="bug_login">Проблемы с входом</option>
          <option value="feature_request">Предложение по улучшению</option>
          <option value="other">Другое</option>
        </select>
      </div>

      {/* Описание проблемы */}
      <div>
        <label htmlFor="help-message" className="block text-sm font-medium text-gray-700 mb-1">
          Описание <span className="text-red-500">*</span>
        </label>
        <textarea
          id="help-message"
          rows={4}
          value={message}
          onChange={handleMessageChange}
          placeholder="Опишите проблему или задайте вопрос..."
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={isSubmitting}
        ></textarea>
      </div>

      {/* Скриншот */}
      <div>
        <label htmlFor="help-screenshot" className="block text-sm font-medium text-gray-700 mb-1">
          Скриншот (не более 5 МБ)
        </label>
        <input
          type="file"
          id="help-screenshot"
          accept="image/*"
          onChange={handleScreenshotChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-blue-700
            focus:outline-none"
          disabled={isSubmitting}
        />
        {screenshot && (
          <p className="mt-1 text-sm text-gray-500">Выбран файл: {screenshot.name}</p>
        )}
      </div>

      {/* Email для ответа */}
      <div>
        <label htmlFor="help-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email для ответа
        </label>
        <input
          type="email"
          id="help-email"
          value={email}
          onChange={handleEmailChange}
          placeholder="ivan@example.com"
          // pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" // Простая валидация на клиенте
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">Укажите email, если хотите получить ответ.</p>
      </div>

      {/* Согласие на обработку ПД */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="help-consent"
            type="checkbox"
            checked={isConsentChecked}
            onChange={handleConsentChange}
            required
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            disabled={isSubmitting}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="help-consent" className="text-gray-700">
            Я согласен на <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">обработку персональных данных</a> в соответствии с ФЗ-152. <span className="text-red-500">*</span>
          </label>
        </div>
      </div>

      {/* Сообщение об ошибке отправки */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          <p>❌ {submitError}</p>
        </div>
      )}

      {/* Кнопка отправки */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || !isConsentChecked}
          className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isSubmitting || !isConsentChecked
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-700 focus:ring-primary'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Отправка...
            </span>
          ) : (
            'Отправить сообщение'
          )}
        </button>
      </div>
    </form>
  );
};

export default SupportForm;
