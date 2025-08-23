// src/services/documentService.ts
import { supabase } from './supabaseClient';
import { Document, DocumentListResponse, DocumentQueryParams, DocumentSortOption } from '../types/document';

/**
 * Сервис для работы с документами.
 * Содержит логику для получения списка документов,
 * поиска, сортировки и скачивания файлов из Supabase Storage.
 */

const DOCUMENTS_TABLE = 'documents';
const DOCUMENTS_BUCKET = 'documents'; // Имя бакета в Supabase Storage, как указано в ТЗ

/**
 * Получает список документов с пагинацией, поиском и сортировкой.
 * @param params - Параметры запроса.
 * @returns Promise с результатом запроса.
 * @throws {Error} При ошибках запроса к Supabase.
 */
export async function getDocuments(params: DocumentQueryParams): Promise<DocumentListResponse> {
    const { searchQuery, sortBy, limit, offset, isPublicOnly } = params;

    try {
        // 1. Начинаем построение запроса
        let query = supabase
            .from(DOCUMENTS_TABLE)
            .select('*', { count: 'exact' }); // Запрашиваем точное количество

        // 2. Применяем фильтры
        if (isPublicOnly) {
            query = query.eq('is_public', true);
        }

        if (searchQuery) {
            // Используем ilike для регистронезависимого поиска
            query = query.ilike('title', `%${searchQuery}%`);
        }

        // 3. Применяем сортировку
        // Предполагаем, что sortBy может быть 'created_at' или 'title'
        // Логика сортировки: "Сначала новые" для `created_at`
        const orderColumn = sortBy === 'title' ? 'title' : 'created_at';
        const ascending = sortBy === 'title'; // Для названия - алфавитный порядок, для даты - сначала новые (desc)
        query = query.order(orderColumn, { ascending });

        // 4. Применяем пагинацию
        query = query.range(offset, offset + limit - 1);

        // 5. Выполняем запрос
        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching documents:', error);
            throw new Error('Не удалось загрузить список документов.');
        }

        // 6. Возвращаем результат
        return {
            documents: data || [],
            total: count || 0,
        };
    } catch (error: any) {
        console.error('Unexpected error in getDocuments service:', error);
        throw new Error(error.message || 'Произошла ошибка при получении документов.');
    }
}

/**
 * (Опционально) Получает URL для скачивания документа из Supabase Storage.
 * @param filePath - Путь к файлу в бакете.
 * @returns URL для скачивания.
 */
export function getDocumentDownloadUrl(filePath: string): string {
    // Используем getPublicUrl, так как бакет `documents` публичный согласно ТЗ
    const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// TODO: Реализовать функцию скачивания файла (downloadDocument) при необходимости,
// если нужно контролировать процесс скачивания на фронтенде.
