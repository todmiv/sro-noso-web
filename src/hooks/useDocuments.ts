// src/hooks/useDocuments.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; // Для определения роли пользователя (гость/член)
import { getDocuments } from '../services/documentService';
import { Document, DocumentListResponse, DocumentQueryParams, DocumentSortOption } from '../types/document';

/**
 * Пользовательский хук для управления состоянием каталога документов.
 *
 * Обрабатывает загрузку, пагинацию, поиск и сортировку документов.
 * Использует documentService для взаимодействия с API.
 */

// --- Типы для состояния хука ---
interface UseDocumentsState {
  /** Массив документов для отображения */
  documents: Document[];
  /** Флаг, указывающий, идет ли загрузка данных */
  loading: boolean;
  /** Сообщение об ошибке, если она произошла */
  error: string | null;
  /** Флаг, указывающий, есть ли еще документы для загрузки (для пагинации) */
  hasNextPage: boolean;
  /** Общее количество документов, соответствующих критериям поиска */
  totalCount: number | null;
}

// --- Типы для параметров хука ---
interface UseDocumentsProps {
  /** Количество документов, загружаемых за один раз (лимит для пагинации) */
  pageSize?: number;
}

/**
 * Хук для управления логикой каталога документов.
 *
 * @param props - Параметры хука.
 * @returns Объект состояния и методы управления.
 */
const useDocuments = ({ pageSize = 20 }: UseDocumentsProps = {}): UseDocumentsState & {
  /** Функция для загрузки следующей страницы документов */
  loadMore: () => void;
  /** Функция для повторной попытки загрузки */
  retry: () => void;
  /** Функция для установки поискового запроса */
  setSearchQuery: (query: string) => void;
  /** Функция для установки параметра сортировки */
  setSortBy: (sort: DocumentSortOption) => void;
  /** Текущий поисковый запрос */
  searchQuery: string;
  /** Текущий параметр сортировки */
  sortBy: DocumentSortOption;
} => {
  // Получаем роль пользователя из контекста аутентификации
  const { role } = useAuth();

  // Состояние хука
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Параметры запроса
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<DocumentSortOption>('newest');
  const [offset, setOffset] = useState<number>(0); // Для пагинации

  // --- Функции для управления состоянием ---

  /**
   * Загружает документы с текущими параметрами.
   * @param append - Если true, добавляет документы к существующему списку (для пагинации).
   */
  const loadDocuments = useCallback(async (append: boolean = false) => {
    if (!append) {
      // Если это новая загрузка (не "Показать ещё"), сбрасываем состояние
      setLoading(true);
      setError(null);
      setDocuments([]);
      setOffset(0);
      setHasNextPage(true);
      setTotalCount(null);
    }

    try {
      const params: DocumentQueryParams = {
        searchQuery: searchQuery || undefined, // Передаем undefined, если пустая строка
        sortBy,
        limit: pageSize,
        offset: append ? offset : 0, // Если добавляем, используем текущий offset
        // Гости видят только публичные документы
        isPublicOnly: role === 'guest',
      };

      const response: DocumentListResponse = await getDocuments(params);

      setTotalCount(response.count);

      if (append) {
        // Добавляем новые документы к существующему списку
        setDocuments(prevDocs => [...prevDocs, ...response.documents]);
        // Обновляем offset для следующей страницы
        setOffset(prevOffset => prevOffset + pageSize);
      } else {
        // Заменяем список документов
        setDocuments(response.documents);
        // Устанавливаем offset для следующей страницы
        setOffset(pageSize);
      }

      // Обновляем флаг наличия следующей страницы
      setHasNextPage(response.hasNextPage);

    } catch (err: any) {
      console.error('Error in useDocuments loadDocuments:', err);
      setError(err.message || 'Произошла ошибка при загрузке документов.');
      if (!append) {
        // При ошибке новой загрузки очищаем список
        setDocuments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, pageSize, offset, role]); // Зависимости useCallback

  /**
   * Загружает следующую страницу документов.
   */
  const loadMore = useCallback(() => {
    if (loading || !hasNextPage) return; // Не загружаем, если уже загружается или нет следующей страницы
    loadDocuments(true); // Загружаем с append = true
  }, [loading, hasNextPage, loadDocuments]);

  /**
   * Повторяет последнюю попытку загрузки.
   */
  const retry = useCallback(() => {
    // Сбрасываем offset, чтобы перезагрузить с начала
    // Это может быть не всегда желаемое поведение, но упрощает логику
    // Альтернатива: хранить последний успешный offset
    loadDocuments(false); // Загружаем с append = false
  }, [loadDocuments]);

  // --- Эффекты ---

  // Эффект для загрузки документов при изменении ключевых параметров
  // (searchQuery, sortBy, role) - это приведет к "новой" загрузке, а не добавлению
  useEffect(() => {
    loadDocuments(false);
  }, [searchQuery, sortBy, role, loadDocuments]); // Добавлен role в зависимости

  // --- Возвращаемое значение ---

  return {
    // Состояние
    documents,
    loading,
    error,
    hasNextPage,
    totalCount,
    // Методы управления
    loadMore,
    retry,
    setSearchQuery,
    setSortBy,
    // Текущие параметры (для привязки к UI-компонентам)
    searchQuery,
    sortBy,
  };
};

export default useDocuments;
