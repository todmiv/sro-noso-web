// src/components/features/documents/DocumentList.tsx
import React, { useCallback } from 'react';
import useDocuments from '../../../hooks/useDocuments';
import DocumentCard from './DocumentCard';
import SearchBar from './SearchBar';
import SortDropdown, { SortOption } from './SortDropdown';
import Button from '../../ui/Button';

/**
 * Компонент для отображения списка документов.
 *
 * Реализует сценарий 2.3 из ТЗ: каталог открытых документов с поиском и сортировкой.
 * Использует useDocuments для управления состоянием и логикой.
 */

const DocumentList: React.FC = () => {
  const {
    documents,
    loading,
    error,
    hasNextPage,
    loadMore,
    retry,
    setSearchQuery,
    setSortBy,
    searchQuery,
    sortBy,
  } = useDocuments({ pageSize: 20 }); // Используем пагинацию по 20 документов

  // Обработчик изменения поискового запроса
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Обработчик изменения сортировки
  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, [setSortBy]);

  return (
    <div className="space-y-6">
      {/* Панель инструментов: поиск и сортировка */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-grow">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск по названию документа..."
            disabled={loading}
          />
        </div>
        <div className="flex-shrink-0">
          <SortDropdown
            value={sortBy}
            onChange={handleSortChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* Статус загрузки */}
      {loading && documents.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <button
                  onClick={retry}
                  className="font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список документов */}
      {!loading && !error && documents.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Документы не найдены</h3>
          <p className="mt-1 text-sm text-gray-500">
            Попробуйте изменить поисковый запрос или сбросить фильтры.
          </p>
        </div>
      )}

      {documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}

      {/* Кнопка "Показать ещё" */}
      {hasNextPage && !error && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Загрузка...
              </>
            ) : (
              'Показать ещё'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
