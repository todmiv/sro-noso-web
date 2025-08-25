// src/components/ui/Input.tsx

import { InputHTMLAttributes, forwardRef } from 'react';

// Определяем типы пропсов
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Необязательная метка
  error?: string; // Сообщение об ошибке
  fullWidth?: boolean; // Растягивать на всю ширину
}

// Используем forwardRef для передачи ref
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      fullWidth = false,
      className = '',
      id, // Используем id для связи label и input
      ...props
    },
    ref
  ) => {
    // Генерируем уникальный id, если он не передан
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Базовые классы Tailwind
    let baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm';

    // Классы для состояния ошибки
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';

    // Финальные классы
    const finalClasses = [
      baseClasses,
      errorClasses,
      fullWidth ? 'w-full' : '',
      className, // Позволяет передавать дополнительные классы
    ].join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={finalClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

// Устанавливаем displayName для удобства отладки
Input.displayName = 'Input';

export default Input;
