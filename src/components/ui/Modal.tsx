// src/components/ui/Modal.tsx

import React, { ReactNode, useEffect, useRef } from 'react';

// Определяем типы пропсов
interface ModalProps {
  isOpen: boolean; // Управляет видимостью модального окна
  onClose: () => void; // Функция для закрытия модального окна
  children: ReactNode; // Содержимое модального окна
  title?: string; // Опциональный заголовок
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; // Размер модального окна
  closeOnOverlayClick?: boolean; // Закрывать при клике вне содержимого
  closeOnEscape?: boolean; // Закрывать по нажатию Escape
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Обработчик нажатия клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Предотвращаем прокрутку фона при открытом модальном окне
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Восстанавливаем прокрутку при закрытии
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Обработчик клика вне содержимого модального окна
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Если модальное окно не открыто, ничего не рендерим
  if (!isOpen) return null;

  // Классы для размеров
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4', // Полная ширина с небольшими отступами по краям
  };

  return (
    // Оверлей
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Контейнер модального окна */}
      <div
        ref={modalRef}
        className={`relative w-full bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh] ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()} // Останавливаем всплытие клика внутри модального окна
      >
        {/* Шапка модального окна с заголовком и кнопкой закрытия */}
        {(!!title || !!onClose) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Основное содержимое модального окна */}
        <div className="flex-grow overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
