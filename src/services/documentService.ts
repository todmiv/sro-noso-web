// src/services/documentService.ts
import { supabase } from './supabaseClient';
import { Document, DocumentListResponse, DocumentQueryParams, DocumentSortOption } from '../types/document';

/**
 * Сервис для работы с документами.
 *
 * Содержит логику для получения списка документов,
 * поиска, сортировки и скачивания файлов из Supabase Storage.
 */

const DOCUMENTS_TABLE = 'documents';
const DOCUMENTS_BUCKET = 'documents'; // Имя бакета в Supabase Storage, как указано в ТЗ

/**
 * Получает список документов с пагинацией, поиском и сортировкой.
 *
 * @param params - Параметры запроса.
 * @returns Promise с результатом запроса.
 * @throws {Error} При ошибках запроса к Supabase.
 */
export async function getDocuments(params: DocumentQueryParams): Promise<DocumentListResponse> {
  const { searchQuery, sortBy, limit, offset, isPublicOnly } = params;

  try {
    let query = supabase
      .from(DOCUMENTS_TABLE)
      .select('*', { count: 'exact' }); // Запрашиваем точное количество

    // Фильтрация по публичности (для гостей)
    if (isPublicOnly) {
      query = query.eq('is_public', true);
    }

    // Поиск по названию
    if (searchQuery) {
      // Используем ilike для регистронезависимого поиска
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Сортировка
    const orderColumn = 'updated_at'; // Сортируем по дате обновления
    const ascending = sortBy === 'oldest'; // 'oldest' - ASC, 'newest' - DESC
    query = query.order(orderColumn, { ascending });

    // Пагинация
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error(`Ошибка при загрузке документов: ${error.message}`);
    }

    const documents: Document[] = data || [];
    const hasNextPage = (count !== null) && (offset + limit < count);

    return {
      data: documents,
      count: count,
      hasNextPage: hasNextPage,
    };

  } catch (error: any) {
    console.error('Unexpected error in getDocuments:', error);
    throw new Error(error.message || 'Произошла непредвиденная ошибка при загрузке документов.');
  }
}

/**
 * Получает прямую ссылку для скачивания документа.
 *
 * @param filePath - Путь к файлу в хранилище Supabase Storage.
 * @param expiresIn - Время жизни ссылки в секундах (по умолчанию 1 час).
 * @returns Promise со строкой URL для скачивания.
 * @throws {Error} При ошибках получения ссылки.
 */
export async function getDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabase
      .storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiresIn); // Создаем подписанную (signed) ссылку

    if (error) {
      console.error('Error creating signed URL for document:', error);
      throw new Error(`Ошибка при получении ссылки на документ: ${error.message}`);
    }

    return data.signedUrl;

  } catch (error: any) {
    console.error('Unexpected error in getDownloadUrl:', error);
    throw new Error(error.message || 'Произошла непредвиденная ошибка при получении ссылки на документ.');
  }
}

/**
 * Получает публичный URL документа.
 * Используется, если файл публичный и не требуется подпись.
 *
 * @param filePath - Путь к файлу в хранилище Supabase Storage.
 * @returns Публичный URL.
 */
export function getPublicUrl(filePath: string): string {
    const { data } = supabase
      .storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
}

// Экспорт всех функций как named exports
// export { getDocuments, getDownloadUrl, getPublicUrl };
