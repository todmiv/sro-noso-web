// src/components/ui/Button.tsx

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

// Определяем типы пропсов
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'; // Варианты стилей кнопки
  size?: 'sm' | 'md' | 'lg'; // Размеры кнопки
  isLoading?: boolean; // Состояние загрузки
  fullWidth?: boolean; // Растягивать на всю ширину
}

// Используем forwardRef для передачи ref
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Базовые классы Tailwind
    let baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Классы для размеров
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    // Классы для вариантов
    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-blue-700 focus:ring-primary',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline: 'border border-primary text-primary bg-white hover:bg-primary/10 focus:ring-primary',
    };

    // Состояния disabled и loading
    const isDisabled = disabled || isLoading;

    // Финальные классы
    const finalClasses = [
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      fullWidth ? 'w-full' : '',
      isDisabled ? 'opacity-50 cursor-not-allowed' : '',
      className, // Позволяет передавать дополнительные классы
    ].join(' ');

    return (
      <button
        ref={ref}
        className={finalClasses}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          // Спиннер загрузки
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

// Устанавливаем displayName для удобства отладки
Button.displayName = 'Button';

export default Button;
