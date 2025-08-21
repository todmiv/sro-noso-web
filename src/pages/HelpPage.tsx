// src/pages/HelpPage.tsx

import React, { useState } from 'react';
// import { submitSupportTicket } from '../services/supportService'; // Будет создан позже
// import { isValidEmail } from '../utils/helpers'; // Будет создан позже

const HelpPage: React.FC = () => {
  // === Состояния формы обратной связи ===
  const [topic, setTopic] = useState<string>(''); // Выбранный пункт из выпадающего списка
  const [message, setMessage] = useState<string>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [email, setEmail] = useState<string>(''); // Предзаполняется для авторизованных пользователей
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConsentChecked, setIsConsentChecked] = useState<boolean>(false); // Согласие на обработку ПД

  // === Состояния аккордеона FAQ ===
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // === Обработчики для формы ===
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

      // await submitSupportTicket(formData); // Вызов сервиса отправки тикета
      
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
      
      // Автоматически скрыть сообщение успеха через 5 секунд
      setTimeout(() => setSubmitSuccess(false), 5000);

    } catch (err) {
      console.error("Ошибка при отправке тикета:", err);
      setSubmitError('Не удалось отправить сообщение. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Обработчики для FAQ (аккордеон) ===
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // === Данные для FAQ (заглушки) ===
  const faqs = [
    {
      question: "Как восстановить пароль?",
      answer: "На экране входа нажмите «Забыли пароль». Введите свой ИНН, и система отправит инструкции на email, указанный в профиле."
    },
    {
      question: "Как продлить членство?",
      answer: "Членство оплачивается ежеквартально. Реквизиты и счёт приходят на email, указанный при регистрации, за 10 дней до окончания срока."
    },
    {
      question: "Ограничения для гостей?",
      answer: "Гости могут просматривать и скачивать открытые документы, а также задавать до 3 вопросов ИИ-консультанту в день."
    },
    {
      question: "Формат документов?",
      answer: "Платформа поддерживает документы в форматах PDF и DOCX. Их можно скачивать или просматривать онлайн."
    },
    {
      question: "Как сообщить об ошибке бота?",
      answer: "Используйте форму обратной связи на этой странице или напишите на support@sro-noso.ru. Укажите, пожалуйста, шаги для воспроизведения ошибки."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Помощь и обратная связь</h1>

      {/* Раздел FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Часто задаваемые вопросы</h2>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
              <button
                className="flex justify-between items-center w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => toggleFaq(index)}
                aria-expanded={openFaqIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === index && (
                <div id={`faq-answer-${index}`} className="p-4 bg-white">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Раздел контактов */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Контакты</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="mb-2"><span className="font-medium">Email поддержки:</span> <a href="mailto:support@sro-noso.ru" className="text-primary hover:underline">support@sro-noso.ru</a></p>
          <p className="mb-2"><span className="font-medium">Телефон:</span> +7 (495) 123-45-67</p>
          <p><span className="font-medium">Часы работы:</span> Понедельник – Пятница, 09:00 – 18:00 (МСК)</p>
        </div>
      </section>

      {/* Раздел формы обратной связи */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Сообщить об ошибке</h2>
        
        {/* Сообщение об успешной отправке */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            <p>✅ Спасибо! Ваше сообщение отправлено. Мы ответим в течение 1 рабочего дня.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
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
      </section>
    </div>
  );
};

export default HelpPage;
