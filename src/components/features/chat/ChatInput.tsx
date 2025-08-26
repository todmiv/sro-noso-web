import React, { useRef, useEffect } from 'react';
interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  maxRows?: number;
  maxLength?: number;
}

const ChatInput: React.FC<ChatInputProps> = ({
    inputValue, 
    onInputChange, 
  onSend,
    onKeyDown, 
  disabled = false,
  isLoading = false,
    placeholder = "Введите ваш вопрос...", 
    maxRows = 5, 
  maxLength = 500
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоматический ресайз textarea
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      // Ограничиваем высоту
      const maxHeight = parseInt(getComputedStyle(document.documentElement).fontSize) * maxRows; // Примерный расчет
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  // Обработчик изменения ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Проверяем максимальную длину
    if (value.length <= maxLength) {
      onInputChange(value);
    }
  };

  // Обработчик отправки
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !isLoading && !disabled) {
      onSend();
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Предотвращаем добавление новой строки
      handleSubmit(e);
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Эффект для ресайза при изменении значения
  useEffect(() => {
    resizeTextarea();
  }, [inputValue, maxRows]);

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 border-t border-gray-200">
      <div className="flex-grow relative">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1} // Начинаем с 1 строки
          maxLength={maxLength} // Устанавливаем атрибут maxLength для браузера
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
          aria-label="Введите ваш вопрос для ИИ-консультанта"
        />
          </div>
      <button
        type="submit"
        disabled={!inputValue.trim() || disabled}
        className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          !inputValue.trim() || isLoading || disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-blue-700 focus:ring-primary'
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
  );
};

export default ChatInput;

