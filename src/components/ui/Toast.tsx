// src/components/ui/Toast.tsx

import React, { useEffect, useState, useCallback } from 'react';

// Типы для toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

export interface Toast {
  id: string; // Уникальный ID
  type: ToastType; // Тип уведомления
  title?: string; // Заголовок (опционально)
  description: string; // Основной текст
  duration?: number; // Длительность показа в мс (по умолчанию 5000)
}

// Props для компонента Toast
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

// Props для контекста и провайдера
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void; // Добавить toast (id генерируется автоматически)
  removeToast: (id: string) => void; // Удалить toast по ID
  clearToasts: () => void; // Очистить все toasts
}

// Контекст для управления toasts
export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Провайдер для контекста
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Функция для добавления нового toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9); // Простой генератор ID
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  // Функция для удаления toast по ID
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Функция для очистки всех toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Значение контекста
  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Хук для использования контекста
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Компонент отдельного уведомления
const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Автоматическое закрытие через duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  // Анимация закрытия
  const handleClose = () => {
    setIsLeaving(true);
    // Задержка для завершения анимации
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Должна совпадать с длительностью transition в CSS
  };

  if (!isVisible) return null;

  // Определяем цвета и иконки в зависимости от типа
  const typeStyles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  const typeIcons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={`relative mb-2 p-4 rounded-md border shadow-lg flex items-start transition-all duration-300 ease-in-out ${
        typeStyles[type]
      } ${isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mr-3">
        {typeIcons[type]}
      </div>
      <div className="flex-1">
        <div className="text-sm">{message}</div>
      </div>
      <button
        onClick={handleClose}
        className="ml-4 flex-shrink-0 bg-transparent border-0 text-current cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full"
        aria-label="Закрыть уведомление"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Компонент отдельного уведомления для использования с контекстом
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  return (
    <Toast
      message={toast.title ? `${toast.title}: ${toast.description}` : toast.description}
      type={toast.type}
      onClose={() => onDismiss(toast.id)}
      duration={toast.duration}
    />
  );
};

// Компонент контейнера для всех toasts
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-50 w-full max-w-xs"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default Toast;

