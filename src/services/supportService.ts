// src/services/supportService.ts
import { supabase } from './supabaseClient';
import { SupportFormSubmission, SupportFormResponse, SupportTicket } from '../types/support';
import { LIMITS } from '../utils/constants';

/**
 * Сервис для работы с системой обратной связи и поддержки.
 *
 * Содержит логику для отправки тикетов поддержки через Edge Function `/report-issue`.
 * В будущем может включать получение FAQ из БД.
 */

const SUPPORT_TICKETS_TABLE = 'support_tickets';
const MAX_SCREENSHOT_SIZE_BYTES = LIMITS.SUPPORT.MAX_SCREENSHOT_SIZE_BYTES;
const ALLOWED_SCREENSHOT_MIME_TYPES = LIMITS.SUPPORT.ALLOWED_SCREENSHOT_MIME_TYPES;

/**
 * Отправляет тикет поддержки через Edge Function `/report-issue`.
 *
 * @param submissionData - Данные формы обратной связи.
 * @returns Promise с результатом отправки.
 * @throws {Error} При ошибках валидации, запроса к Edge Function или сетевых ошибках.
 */
export async function submitSupportTicket(submissionData: SupportFormSubmission): Promise<SupportFormResponse> {
    const { email, topic, message, screenshot, recaptchaToken } = submissionData;

    // 1. Базовая валидация данных формы
    if (!topic) {
        throw new Error('Тема обращения обязательна.');
    }

    if (!message || message.trim().length === 0) {
        throw new Error('Текст сообщения обязателен.');
    }

    // 2. Валидация скриншота (если предоставлен)
    let screenshotUrl: string | undefined = undefined;
    if (screenshot) {
        if (screenshot.size > MAX_SCREENSHOT_SIZE_BYTES) {
            throw new Error(`Размер скриншота превышает ${MAX_SCREENSHOT_SIZE_BYTES / (1024 * 1024)} МБ.`);
        }

        if (!ALLOWED_SCREENSHOT_MIME_TYPES.includes(screenshot.type)) {
            throw new Error('Недопустимый формат файла скриншота. Разрешены: JPG, PNG, WEBP, GIF.');
        }

        // 3. Загрузка скриншота в Supabase Storage (в бакет 'support-screenshots')
        try {
            const fileExt = screenshot.name.split('.').pop()?.toLowerCase() || 'png';
            // Генерируем уникальное имя файла
            const fileName = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `screenshots/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('support-screenshots') // Предполагаем имя бакета 'support-screenshots'
                .upload(filePath, screenshot, {
                    cacheControl: '3600', // Кэшировать на 1 час
                    upsert: false // Не перезаписывать существующие файлы
                });

            if (uploadError) {
                console.error('Error uploading screenshot:', uploadError);
                throw new Error('Ошибка при загрузке скриншота.');
            }

            // Получаем публичный URL загруженного файла
            const { data } = supabase.storage
                .from('support-screenshots')
                .getPublicUrl(filePath);

            screenshotUrl = data.publicUrl;

        } catch (uploadError: any) {
            console.error('Error during screenshot upload process:', uploadError);
            throw new Error(uploadError.message || 'Ошибка при обработке скриншота.');
        }
    }

    // 4. Подготовка данных для отправки в Edge Function
    const requestBody = {
        email: email || null,
        topic,
        message,
        screenshotUrl: screenshotUrl || null, // Передаем URL, а не сам файл
        recaptchaToken: recaptchaToken || null, // Может быть обработано на стороне Edge Function
    };

    try {
        // 5. Вызов Edge Function через клиент Supabase
        const { data, error } = await supabase.functions.invoke('report-issue', {
            body: requestBody,
        });

        if (error) {
            console.error('Edge Function error in submitSupportTicket:', error);
            throw new Error(`Ошибка сервиса поддержки: ${error.message || 'Неизвестная ошибка.'}`);
        }

        // Предполагаем, что `data` соответствует интерфейсу `SupportFormResponse`
        const response: SupportFormResponse = data as SupportFormResponse;

        if (!response.success) {
            // Сообщение об ошибке приходит от Edge Function
            throw new Error(response.message || 'Не удалось отправить обращение.');
        }

        return response;

    } catch (error: any) {
        // Если это не ошибка от Supabase Functions, это сетевая ошибка или ошибка парсинга
        if (!(error instanceof Error && error.message.startsWith('Ошибка сервиса поддержки'))) {
            console.error('Network or unexpected error in submitSupportTicket:', error);
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
 *
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
    } catch (error: any) {
        console.error('Unexpected error in getFAQ:', error);
        return [];
    }
    */
    console.warn('getFAQ function is a stub. FAQ table or logic needs to be implemented.');
    return []; // Возвращаем пустой массив как заглушку
}

// Экспорт всех функций как named exports
// export { submitSupportTicket, getFAQ };
