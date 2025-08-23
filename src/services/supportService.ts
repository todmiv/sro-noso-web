// src/services/supportService.ts
import { supabase } from './supabaseClient';
import { SupportFormSubmission, SupportFormResponse, SupportTicket } from '../types/support';
import { LIMITS } from '../utils/constants';

/**
 * Сервис для работы с системой обратной связи и поддержки.
 * Содержит логику для отправки тикетов поддержки через Edge Function `/report-issue`.
 * В будущем может включать получение FAQ из БД.
 */

const SUPPORT_TICKETS_TABLE = 'support_tickets';
const SUPPORT_SCREENSHOTS_BUCKET = 'support-screenshots'; // Имя бакета для скриншотов

/**
 * Отправляет тикет поддержки через Edge Function.
 * @param submission - Данные формы поддержки.
 * @returns Promise<boolean> - true, если успешно.
 * @throws {Error} При ошибках запроса.
 */
export async function submitSupportTicket(submission: SupportFormSubmission): Promise<boolean> {
    const { email, topic, message, screenshot, recaptchaToken } = submission;

    try {
        // 1. Валидация (если нужно, например, обязательные поля)
        // if (!message.trim()) {
        //     throw new Error('Сообщение не может быть пустым.');
        // }

        // 2. Загрузка скриншота (если он приложен)
        let screenshotUrl: string | null = null;
        if (screenshot) {
            // Генерируем уникальное имя файла
            const fileExtension = screenshot.name.split('.').pop();
            const fileName = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
            const filePath = `${fileName}`; // Можно добавить подкаталог, например, `screenshots/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(SUPPORT_SCREENSHOTS_BUCKET)
                .upload(filePath, screenshot, {
                    cacheControl: '3600', // 1 час
                    upsert: false, // Не перезаписывать существующие
                });

            if (uploadError) {
                console.error('Error uploading screenshot:', uploadError);
                // Можно различать ошибки (размер, тип) и давать пользователю конкретные сообщения
                if (uploadError.message.includes('larger than')) {
                     throw new Error('Файл скриншота слишком большой.');
                } else if (uploadError.message.includes('invalid mime type')) {
                     throw new Error('Недопустимый тип файла скриншота.');
                } else {
                     throw new Error('Ошибка при загрузке скриншота.');
                }
            }

            // Получаем публичный URL (если бакет настроен как публичный для чтения, иначе через signed URL)
            // Так как бакет `support-screenshots` приватный, URL будет использоваться только внутри Edge Function
            // Но для передачи в функцию можно передать путь к файлу
            // const { data: publicUrlData } = supabase.storage
            //     .from(SUPPORT_SCREENSHOTS_BUCKET)
            //     .getPublicUrl(filePath);
            // screenshotUrl = publicUrlData.publicUrl;

            // Передаем только путь к файлу, так как сам файл будет обработан в Edge Function
             screenshotUrl = filePath;
        }

        // 3. Подготовка данных для отправки в Edge Function
        const requestBody = {
            email: email || null,
            topic,
            message,
            screenshotUrl: screenshotUrl || null, // Передаем URL, а не сам файл
            recaptchaToken: recaptchaToken || null, // Может быть обработано на стороне Edge Function
        };

        // --- РЕАЛЬНАЯ ЛОГИКА ---

        // 4. Вызов Edge Function через клиент Supabase
        // Убедитесь, что имя функции совпадает с именем, заданным при её создании в Supabase
        const { data, error } = await supabase.functions.invoke('report-issue', {
            body: requestBody,
        });

        if (error) {
            console.error('Edge Function error in submitSupportTicket:', error);
            // Можно различать ошибки от функции и сетевые ошибки
             if (!(error instanceof Error && error.message.startsWith('Ошибка сервиса поддержки'))) {
                 // Сетевая ошибка или ошибка парсинга
                 throw new Error('Сервис поддержки временно недоступен. Пожалуйста, попробуйте позже.');
             }
             // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
             throw error;
        }

        // 5. Проверка успешности ответа от функции
        if (!data || !data.success) {
             console.error('Edge Function returned failure for support ticket:', data);
             throw new Error(data?.message || 'Не удалось отправить обращение в службу поддержки.');
        }

        // 6. Возврат результата
        return true;

        // - КОНЕЦ РЕАЛЬНОЙ ЛОГИКИ -

    } catch (error: any) {
         console.error('Unexpected error in submitSupportTicket service:', error);
         // Если это не ошибка от Supabase Functions, это сетевая ошибка или ошибка парсинга
         if (!(error instanceof Error && error.message.startsWith('Ошибка сервиса поддержки'))) {
             throw new Error('Сервис поддержки временно недоступен. Пожалуйста, попробуйте позже.');
         }
         // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
         throw error;
    }
}

/**
 * (Опционально) Получает список часто задаваемых вопросов (FAQ) из БД.
 * Предполагается, что будет таблица `faq` или аналогичная.
 * Пока возвращает пустой массив, так как в ТЗ (пункт 11) такой таблицы нет.
 * @returns Promise с массивом FAQ.
 */
export async function getFAQ(): Promise<any[]> { // TODO: Определить тип для FAQ
    // Пример реализации, если будет таблица `faq`
    /*
    try {
        const { data, error } = await supabase
            .from('faq')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching FAQ:', error);
            // Не критично, просто возвращаем пустой массив
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Unexpected error fetching FAQ:', err);
        return []; // Не критично
    }
    */
    // Пока возвращаем пустой массив
    return [];
}
