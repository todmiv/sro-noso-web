// src/components/features/chat/Message.tsx

import React from 'react';

// Определяем типы пропсов
interface MessageProps {
  id: string; // Уникальный ID сообщения
  role: 'user' | 'assistant'; // Роль отправителя
  content: string; // Текст сообщения
  timestamp: Date; // Время отправки
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void; // Callback для обратной связи
}

const Message: React.FC<MessageProps> = ({ id, role, content, timestamp, onFeedback }) => {
  // Функция для рендеринга ограниченного Markdown
  const renderMarkdown = (text: string) => {
    // 1. Заменяем **жирный текст**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Добавляем текст до совпадения
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Добавляем жирный элемент
      parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // 2. Заменяем - элементы списка (простой случай, один уровень)
    // Это сложнее сделать инкрементально, поэтому обернем весь текст в контейнер, который будет обрабатывать это через CSS
    // Или можно сделать более сложный парсер, но для MVP достаточно базового.
    
    // Для простоты MVP, обернем в div с классом prose, который может помочь с базовым форматированием
    // или просто вернем массив parts.
    // В данном случае, parts уже содержит <strong>, просто вернем его.
    // Для списка можно добавить простую замену, но это выходит за рамки базового MVP форматирования.
    
    return <>{parts}</>;
  };

  // Обработчики обратной связи
  const handlePositiveFeedback = () => {
    if (onFeedback) {
      onFeedback(id, 'positive');
    }
  };

  const handleNegativeFeedback = () => {
    if (onFeedback) {
      onFeedback(id, 'negative');
    }
  };

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-2 ${
          role === 'user'
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
        }`}
      >
        {role === 'assistant' ? (
          // Ответ ИИ с ограниченным Markdown и кнопками обратной связи
          <div>
            <div className="prose prose-sm max-w-none">
              {/* В реальной реализации здесь будет рендеринг ограниченного Markdown */}
              {/* Пока используем простую замену для жирного текста */}
              <p>{renderMarkdown(content)}</p>
            </div>
            {/* Кнопки обратной связи (inline) - только для сообщений ассистента */}
            <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
              <span>Ответ был полезен?</span>
              <button
                onClick={handlePositiveFeedback}
                className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                aria-label="Помогло"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button
                onClick={handleNegativeFeedback}
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
          <p>{content}</p>
        )}
      </div>
    </div>
  );
};

export default Message;
