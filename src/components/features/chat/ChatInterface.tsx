import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import useChat from '../../../hooks/useChat';
import Message from './Message';
import ChatInput from './ChatInput';

const ChatInterface: React.FC = () => {
  const { role } = useAuth();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    isLimitExceeded,
    maxQuestionLength
  } = useChat();

  // State for user input
  const [currentQuestion, setCurrentQuestion] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Прокрутка вниз при добавлении новых сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Обработчик отправки вопроса
  const handleSend = () => {
    if (currentQuestion.trim()) {
      sendMessage(currentQuestion);
      setCurrentQuestion('');
    }
  };

  // Обработчик нажатия Enter в поле ввода
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Заголовок чата */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">ИИ-консультант</h2>
        <p className="text-xs text-gray-500 mt-1">
          Задайте вопрос по деятельности СРО. Ответы ИИ могут содержать неточности.
        </p>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Начните диалог</h3>
            <p className="mt-1 text-xs text-gray-500">
              Задайте свой первый вопрос ИИ-консультанту.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message 
            key={index} 
            content={message.content} 
            role={message.role} 
          />
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 pt-1">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-500">ИИ-консультант печатает...</div>
              <div className="mt-1 flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Область ввода */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <button
                    onClick={clearError}
                    className="font-medium text-red-800 hover:text-red-900 underline focus:outline-none"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLimitExceeded && (
          <div className="mb-3 rounded-md bg-yellow-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {role === 'guest'
                    ? 'Превышен суточный лимит вопросов ИИ (3 вопроса в день).'
                    : 'Что-то пошло не так с лимитами.'}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {role === 'guest' ? (
                    <p>
                      Пожалуйста, авторизуйтесь как член СРО для снятия ограничений или попробуйте снова завтра.
                    </p>
                  ) : (
                    <p>
                      Если вы считаете, что это ошибка, попробуйте перезагрузить страницу.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <ChatInput
          inputValue={currentQuestion}
          onInputChange={(value: string) => setCurrentQuestion(value)}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isLimitExceeded}
        />

        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
          <div>
            {role === 'guest' ? (
              <span>Гостевой режим: ограничение 3 вопроса в день.</span>
            ) : (
              <span>Для членов СРО ограничения на количество вопросов сняты.</span>
            )}
          </div>
          <div>
            {currentQuestion.length}/{maxQuestionLength}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
