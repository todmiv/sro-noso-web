// src/components/features/help/SupportForm.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { submitSupportTicket } from '../../../services/supportService';
import { SupportFormSubmission, SupportTopic } from '../../../types/support';
import { LIMITS } from '../../../utils/constants';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Toast from '../../ui/Toast';

/**
 * Компонент формы обратной связи.
 *
 * Реализует сценарий 2.6 из ТЗ: отправка тикетов поддержки.
 * Включает поля темы, сообщения, скриншота и email.
 * Использует supportService для отправки данных.
 */

const SupportForm: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояние формы
  const [email, setEmail] = useState<string>(user?.recovery_email || '');
  const [topic, setTopic] = useState<SupportTopic>(SupportTopic.TechnicalIssue);
  const [message, setMessage] = useState<string>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Функция для показа Toast
  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  // Обработчик изменения скриншота
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка размера файла
      if (file.size > LIMITS.SUPPORT.MAX_SCREENSHOT_SIZE_BYTES) {
        showToastMessage(`Размер файла превышает ${LIMITS.SUPPORT.MAX_SCREENSHOT_SIZE_BYTES / (1024 * 1024)} МБ.`, 'error');
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Сбросить input
        }
        return;
      }

      // Проверка типа файла
      if (!LIMITS.SUPPORT.ALLOWED_SCREENSHOT_MIME_TYPES.includes(file.type)) {
        showToastMessage('Недопустимый формат файла. Разрешены: JPG, PNG, WEBP, GIF.', 'error');
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Сбросить input
        }
        return;
      }

      setScreenshot(file);
    } else {
      setScreenshot(null);
    }
  };

  // Обработчик удаления скриншота
  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Сбросить input
    }
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!topic) {
      setSubmitError('Пожалуйста, выберите тему обращения.');
      return;
    }

    if (!message.trim()) {
      setSubmitError('Пожалуйста, введите текст сообщения.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData: SupportFormSubmission = {
        email: email || undefined,
        topic,
        message,
        screenshot: screenshot || undefined,
        // recaptchaToken: recaptchaToken || undefined, // TODO: Добавить reCAPTCHA v3
      };

      const response = await submitSupportTicket(submissionData);

      if (response.success) {
        setSubmitSuccess(true);
        showToastMessage('Спасибо! Ваше обращение отправлено. Мы ответим в течение 1 рабочего дня.', 'success');
        // Сброс формы
        setMessage('');
        setScreenshot(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Сбросить input файла
        }
        // Email и тема остаются для удобства пользователя
      } else {
        throw new Error(response.message || 'Не удалось отправить обращение.');
      }
    } catch (err: any) {
      console.error('Error submitting support ticket:', err);
      const errorMessage = err.message || 'Произошла ошибка при отправке обращения. Пожалуйста, попробуйте позже.';
      setSubmitError(errorMessage);
      showToastMessage(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Автозаполнение email при изменении пользователя
  useEffect(() => {
    if (user?.recovery_email) {
      setEmail(user.recovery_email);
    }
  }, [user]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Форма обратной связи</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email (опционально)
          </label>
          <div className="mt-1">
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Укажите email, если хотите получить ответ.
            </p>
          </div>
        </div>

        {/* Тема */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
            Тема обращения
          </label>
          <div className="mt-1">
            <select
              id="topic"
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as SupportTopic)}
              disabled={isSubmitting}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value={SupportTopic.TechnicalIssue}>Техническая проблема</option>
              <option value={SupportTopic.ImprovementSuggestion}>Предложение по улучшению</option>
              <option value={SupportTopic.FunctionalityQuestion}>Вопрос по функциональности</option>
              <option value={SupportTopic.Other}>Другое</option>
            </select>
          </div>
        </div>

        {/* Сообщение */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Сообщение
          </label>
          <div className="mt-1">
            <textarea
              id="message"
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={isSubmitting}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Опишите ваш вопрос или проблему..."
            />
          </div>
        </div>

        {/* Скриншот */}
        <div>
          <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700">
            Скриншот (опционально)
          </label>
          <div className="mt-1 flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              id="screenshot"
              name="screenshot"
              accept={LIMITS.SUPPORT.ALLOWED_SCREENSHOT_MIME_TYPES.join(',')}
              onChange={handleScreenshotChange}
              disabled={isSubmitting}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                disabled:opacity-50"
            />
          </div>
          {screenshot && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="truncate">{screenshot.name}</span>
              <button
                type="button"
                onClick={handleRemoveScreenshot}
                disabled={isSubmitting}
                className="ml-2 bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">Удалить</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Максимальный размер: {LIMITS.SUPPORT.MAX_SCREENSHOT_SIZE_BYTES / (1024 * 1024)} МБ. Разрешённые форматы: JPG, PNG, WEBP, GIF.
          </p>
        </div>

        {/* Ошибки и успех */}
        {submitError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {submitError}
                </h3>
              </div>
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Спасибо! Ваше обращение отправлено. Мы ответим в течение 1 рабочего дня.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* reCAPTCHA и Чекбокс согласия - Отложены */}
        {/* 
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              required
              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="consent" className="font-medium text-gray-700">
              Я согласен с <a href="/privacy" className="text-primary-600 hover:text-primary-500">Политикой конфиденциальности</a> и даю согласие на обработку персональных данных согласно ФЗ-152.
            </label>
          </div>
        </div>
        */}

        {/* Кнопка отправки */}
        <div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Отправка...
              </>
            ) : (
              'Отправить обращение'
            )}
          </Button>
        </div>
      </form>

      {/* Toast для отображения сообщений */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default SupportForm;
