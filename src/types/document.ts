// src/types/document.ts

/**
 * Типы данных, связанные с документами.
 *
 * Основаны на схеме таблицы `documents` в Supabase (ТЗ, пункт 11).
 */

/**
 * Интерфейс, представляющий метаданные документа.
 * Соответствует структуре таблицы `documents` в Supabase.
 */
export interface Document {
  /** Уникальный идентификатор документа (UUID) */
  id: string;
  /** Название документа */
  title: string;
  /** Путь к файлу в хранилище Supabase Storage */
  file_path: string;
  /** Размер файла в байтах */
  file_size: number | null;
  /** MIME-тип файла (например, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document) */
  mime_type: string | null;
  /** Флаг, указывающий, является ли документ общедоступным */
  is_public: boolean;
  /** Дата создания записи */
  created_at: string; // Используем string для дат в формате ISO
  /** Дата последнего обновления записи */
  updated_at: string; // Используем string для дат в формате ISO
}

/**
 * Тип для параметров сортировки документов.
 */
export type DocumentSortOption = 'newest' | 'oldest';

/**
 * Тип для результата запроса списка документов.
 * Может включать дополнительные поля, например, для пагинации.
 */
export interface DocumentListResponse {
  /** Массив документов */
  data: Document[];
  /** Общее количество документов, соответствующих критериям поиска (для пагинации) */
  count: number | null;
  /** Флаг, указывающий, есть ли еще данные для загрузки */
  hasNextPage: boolean;
}

/**
 * Тип для параметров запроса списка документов.
 */
export interface DocumentQueryParams {
  /** Поисковый запрос по названию */
  searchQuery?: string;
  /** Параметр сортировки */
  sortBy: DocumentSortOption;
  /** Количество документов на страницу (лимит) */
  limit: number;
  /** Смещение (offset) для пагинации */
  offset: number;
  /** Флаг, указывающий, запрашивать только публичные документы (для гостей) */
  isPublicOnly?: boolean;
}
