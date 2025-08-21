// src/pages/DocumentsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams } from 'react-router-dom'; // Для работы с параметрами URL (поиска, сортировки)
// import { useQuery } from '@tanstack/react-query'; // Для управления состоянием загрузки/ошибок/кэширования
// import { fetchDocuments } from '../services/documentService'; // Будет создан позже
// import DocumentCard from '../components/features/documents/DocumentCard'; // Будет создан позже
// import SearchBar from '../components/features/documents/SearchBar'; // Будет создан позже
// import { Document } from '../types/document'; // Будет создан позже

const DocumentsPage: React.FC = () => {
  // === Состояния страницы ===
  // const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>(''); // Заглушка для поискового запроса
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // Заглушка для сортировки
  // const [page, setPage] = useState<number>(1); // Для пагинации
  // const limit = 20; // Лимит документов на страницу

  // === Состояния загрузки и ошибок (заглушки) ===
  // const { data, error, isLoading, isFetching, refetch } = useQuery<...>({...});
  const isLoading = false; // Заглушка
  const isFetching = false; // Заглушка
  const error = null; // Заглушка
  // const documents: Document[] = data?.documents || []; // Заглушка
  // const totalDocuments = data?.total || 0; // Заглушка

  // === Заглушки для данных документов ===
  const documents = [
    {
      id: '1',
      title: 'Устав СРО НОСО',
      file_path: '/sample-document.pdf',
      file_size: 1200000, // 1.2 MB
      mime_type: 'application/pdf',
      is_public: true,
      created_at: '2025-06-01T10:00:00Z',
    },
    {
      id: '2',
      title: 'Рекомендации по охране труда',
      file_path: '/sample-document2.docx',
      file_size: 800000, // 800 KB
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      is_public: true,
      created_at: '2025-05-15T14:30:00Z',
    },
    // ... больше документов
  ];

  // === Обработчики ===
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // В реальной реализации здесь будет debounce и обновление searchParams
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'newest' | 'oldest');
    // В реальной реализации здесь будет обновление searchParams
  };

  // const handleLoadMore = () => {
  //   setPage(prev => prev + 1);
  // };

  // const handleRetry = () => {
  //   refetch();
  // };

  // === Эффект для обновления заголовка страницы (React Helmet) ===
  // useEffect(() => {
  //   // Здесь будет логика для установки title и meta description
  // }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Заголовок страницы */}
      <h1 className="text-2xl font-bold text-primary mb-6">Каталог документов</h1>

      {/* Панель поиска и сортировки */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Поле поиска */}
        <div className="w-full md:w-2/3">
          <label htmlFor="document-search" className="sr-only">
            Поиск документов
          </label>
          <input
            type="text"
            id="document-search"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={handleSearchChange}
            // disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Выбор сортировки */}
        <div className="w-full md:w-auto">
          <label htmlFor="sort-order" className="sr-only">
            Сортировать по
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={handleSortChange}
            // disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
          </select>
        </div>
      </div>

      {/* Состояние загрузки */}
      {isLoading && (
        <div className="flex justify-center items-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg">Загрузка документов...</span>
        </div>
      )}

      {/* Состояние ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Ошибка! </strong>
          <span className="block sm:inline">
            {/* Не удалось загрузить документы. Проверьте подключение или попробуйте позже. */}
            Не удалось загрузить документы. Попробуйте позже. {/* Заглушка для текста ошибки */}
          </span>
          {/* <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Повторить
          </button> */}
        </div>
      )}

      {/* Список документов */}
      {!isLoading && !error && (
        <>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))} */}
              {/* Заглушки для карточек документов */}
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                  <div className="p-5">
                    <div className="flex items-start">
                      {/* Иконка документа */}
                      <div className="flex-shrink-0">
                        {doc.mime_type === 'application/pdf' ? (
                          <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : (
                          <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{doc.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {/* Форматируем дату и размер в реальной реализации */}
                          Обновлен: 01.06.2025
                          <br />
                          Размер: 1.2 МБ
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <a
                        href={doc.file_path} // В реальной реализации будет ссылка на Supabase Storage
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Просмотреть
                      </a>
                      <a
                        href={doc.file_path} // В реальной реализации будет ссылка на Supabase Storage
                        download={doc.title} // Предлагает имя файла при скачивании
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Скачать
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Состояние "пустой список"
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Документы не найдены</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? 'Попробуйте изменить поисковый запрос.' : 'Пока нет доступных документов. Мы сообщим, когда появятся.'}
              </p>
            </div>
          )}

          {/* Пагинация (заглушка) */}
          {/* {totalDocuments > documents.length && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                  isFetching
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isFetching ? 'Загрузка...' : 'Показать ещё 20'}
              </button>
            </div>
          )} */}
        </>
      )}
    </div>
  );
};

export default DocumentsPage;
