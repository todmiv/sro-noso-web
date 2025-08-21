// src/pages/AskAIPage.tsx

import React, { useState, useEffect, useRef } from 'react';
// import { useAuth } from '../hooks/useAuth'; // Будет создан позже
// import { sendMessage } from '../services/chatService'; // Будет создан позже
// import { useLocalStorage } from '../hooks/useLocalStorage'; // Будет создан позже
// import { Message } from '../types/chat'; // Будет создан позже

const AskAIPage: React.FC = () => {
  // === Состояние аутентификации (заглушка) ===
  // const { isAuthenticated, user } = useAuth();
  const isAuthenticated = false; // Заглушка
  // const user = { id: 'guest-uuid' }; // Заглушка для гостя

  // === Состояния чата ===
  // const [messages, setMessages] = useState<Message[]>([]); // Будет создан позже
  const [messages, setMessages] = useState<any[]>([
    // Заглушки для начальных сообщений
    { id: '1', role: 'assistant', content: 'Задайте любой вопрос по документам СРО НОСО.', timestamp: new Date() },
    // { id: '2', role: 'user', content: 'Какие документы нужны для вступления?', timestamp: new Date() },
    // { id: '3', role: 'assistant', content: 'Для вступления в СРО НОСО потребуются: Устав, свидетельство о регистрации, и другие документы, которые можно найти в разделе "Документы".', timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string | null>(null); // Для ошибок сети и т.п.

  // === Ограничения для гостей ===
  // const [dailyLimit, setDailyLimit] = useState<number>(0); // Текущий счетчик
  const dailyLimit = 2; // Заглушка
  const GUEST_LIMIT = 3; // Максимум запросов для гостя в день

  // === Refs ===
  const messagesEndRef = useRef<HTMLDivElement>(null); // Для автопрокрутки
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Для авто-ресайза

  // === Функции ===

  // Автопрокрутка вниз при новых сообщениях
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Автоматический ресайз textarea
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Ограничение высоты
    }
  };

  // Обработчик изменения ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Ограничение длины ввода (500 для гостей, 2000 для членов)
    const maxLength = isAuthenticated ? 2000 : 500;
    if (value.length <= maxLength) {
      setInputValue(value);
    }
    // setError(null); // Сброс ошибки при вводе
  };

  // Обработчик отправки сообщения
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const question = inputValue.trim();
    if (!question) return;

    // Проверка лимита для гостей
    if (!isAuthenticated && dailyLimit >= GUEST_LIMIT) {
      // setError('Вы использовали 3 вопроса за сегодня. Войдите, чтобы задавать без ограничений.');
      alert('Вы использовали 3 вопроса за сегодня. Войдите, чтобы задавать без ограничений.');
      return;
    }

    // Очистка поля ввода и сброс ошибки
    setInputValue('');
    // setError(null);
    setIsLoading(true);

    try {
      // Добавление сообщения пользователя в локальное состояние
      const userMessage = {
        id: `msg-${Date.now()}`, // Уникальный ID для локального отображения
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // В реальной реализации здесь будет вызов API
      // const aiResponse = await sendMessage(question, user?.id);
      
      // Имитация задержки и ответа ИИ
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Это имитация ответа ИИ на ваш вопрос: "${question}". В реальной системе здесь будет содержательный ответ, основанный на документах СРО.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // В реальной реализации здесь нужно обновить счетчик для гостей
      // if (!isAuthenticated) {
      //   setDailyLimit(prev => prev + 1);
      // }

    } catch (err) {
      console.error("Ошибка при отправке сообщения:", err);
      // setError('Не удалось получить ответ. Попробуйте через минуту.');
      alert('Не удалось получить ответ. Попробуйте через минуту.');
      // Удаление последнего сообщения пользователя в случае ошибки?
      // setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик нажатия Enter для отправки (без Shift)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any); // handleSubmit ожидает FormEvent, но KeyboardEvent тоже подойдет для preventDefault
    }
  };

  // Обратная связь по сообщению (заглушка)
  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    console.log(`Feedback для сообщения ${messageId}: ${feedback}`);
    // В реальной реализации здесь будет вызов API для сохранения обратной связи
    alert(`Спасибо за ваш отзыв: ${feedback === 'positive' ? 'Помогло' : 'Не помогло'}!`);
  };

  // Эффекты
  useEffect(() => {
    // Автопрокрутка при изменении сообщений
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Авто-ресайз textarea при изменении значения
    resizeTextarea();
  }, [inputValue]);

  // useEffect(() => {
  //   // Загрузка истории чата и счетчика для гостей при монтировании
  //   // loadChatHistory();
  //   // loadGuestLimit();
  // }, [isAuthenticated, user?.id]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-6"> {/* Высота с учетом высоты шапки */}
      <h1 className="text-2xl font-bold text-primary mb-4">ИИ-консультант</h1>

      {/* Область сообщений */}
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    // Ответ ИИ с Markdown (ограниченным) и кнопками обратной связи
                    <div>
                      <div className="prose prose-sm max-w-none">
                        {/* В реальной реализации здесь будет рендеринг ограниченного Markdown */}
                        <p>{message.content}</p>
                      </div>
                      {/* Кнопки обратной связи (inline) */}
                      <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                        <span>Ответ был полезен?</span>
                        <button
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                          aria-label="Помогло"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                          aria-label="Не помогло"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m0 0v9m0-9h2.765a2 2 0 011.789 2.894l-3.5 7A2 2 0 0119.264 15H15m0 0v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Сообщение пользователя
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              // Индикатор загрузки для ответа ИИ
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} /> {/* Элемент для автопрокрутки */}
          </div>
        ) : (
          // Сообщение по умолчанию, если нет истории
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>Начните диалог, задав свой первый вопрос ИИ-консультанту.</p>
          </div>
        )}
      </div>

      {/* Область ввода */}
      <div className="flex flex-col">
        {/* Информационная плашка для гостей */}
        {!isAuthenticated && (
          <div className="mb-2 text-sm text-gray-600 flex justify-between items-center">
            <span>
              Осталось запросов: {GUEST_LIMIT - dailyLimit} из {GUEST_LIMIT}
            </span>
            <a href="/profile" className="text-primary hover:underline">
              Войти для снятия ограничений
            </a>
          </div>
        )}

        {/* Форма ввода */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Введите ваш вопрос..." : "Введите ваш вопрос (до 500 символов)..."}
            disabled={isLoading || (!isAuthenticated && dailyLimit >= GUEST_LIMIT)}
            rows={1}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
            aria-label="Введите ваш вопрос"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || (!isAuthenticated && dailyLimit >= GUEST_LIMIT)}
            className={`px-4 py-2 font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isLoading || !inputValue.trim() || (!isAuthenticated && dailyLimit >= GUEST_LIMIT)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-blue-700 focus:ring-primary'
            }`}
            aria-label={isLoading ? "Отправка..." : "Отправить вопрос"}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>

        {/* Сообщение об ошибке (заглушка) */}
        {/* {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default AskAIPage;
