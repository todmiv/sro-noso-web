// src/components/features/documents/DocumentCard.tsx

import React from 'react';
// Удален неиспользуемый импорт Link
// import Button from '../../ui/Button'; // Можно использовать, если нужно
// import Modal from '../../ui/Modal'; // Для предварительного просмотра PDF
// import { Document } from '../../../types/document'; // Будет создан позже

// Пропсы для компонента
interface DocumentCardProps {
  // document: Document; // Тип будет определен позже
  document: {
    id: string;
    title: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    is_public: boolean;
    created_at: string; // ISO строка
  };
  // onPreview?: (document: Document) => void; // Callback для предварительного просмотра
  onPreview?: (document: any) => void; // Заглушка
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPreview }) => {
  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Определяем иконку по MIME-типу
  const getIcon = () => {
    if (document.mime_type === 'application/pdf') {
      return (
        <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (document.mime_type.startsWith('application/vnd.openxmlformats-officedocument')) {
      return (
        <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    // Иконка по умолчанию
    return (
      <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Обработчик для кнопки "Просмотреть"
  const handlePreview = () => {
    if (onPreview) {
      onPreview(document);
    } else {
      // Простой переход к файлу или открытие в новой вкладке
      // Для PDF можно использовать PDF.js, для DOCX - Google Docs Viewer
      if (document.mime_type === 'application/pdf') {
        // Открытие PDF.js в модальном окне или новой вкладке
        // Пока просто откроем в новой вкладке
        window.open(document.file_path, '_blank');
      } else if (document.mime_type.startsWith('application/vnd.openxmlformats-officedocument')) {
        // Используем Google Docs Viewer для DOCX
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(document.file_path)}&embedded=true`;
        window.open(googleDocsUrl, '_blank');
      } else {
        // Для других типов просто скачиваем
        window.open(document.file_path, '_blank');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-start">
          {/* Иконка документа */}
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">{document.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Обновлен: {formatDate(document.created_at)}
              <br />
              Размер: {formatFileSize(document.file_size)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handlePreview}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Просмотреть
          </button>
          <a
            href={document.file_path}
            download={document.title}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Скачать
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
