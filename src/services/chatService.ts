// src/services/chatService.ts
import { supabase } from './supabaseClient';
import { AskAIRequest, ChatHistoryItem, UserRole } from '../types/chat';
import { LIMITS } from '../utils/constants';
import { getItemFromStorage, setItemToStorage, removeItemFromStorage } from '../utils/storageUtils';

/**
 * Сервис для работы с ИИ-консультантом.
 * Содержит логику для отправки вопросов в Edge Function `/ask`.
 */

const GUEST_QUESTIONS_COUNT_KEY = 'guest_questions_count_today';
const GUEST_CHAT_HISTORY_KEY = 'guest_chat_history';

/**
 * Проверяет, не превышен ли лимит вопросов для гостя.
 * @returns true, если лимит не превышен, false в противном случае.
 */
function checkGuestLimits(): boolean {
    const countStr = getItemFromStorage(GUEST_QUESTIONS_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    return count < LIMITS.GUEST_DAILY_QUESTIONS;
}

/**
 * Увеличивает счетчик вопросов гостя в localStorage.
 */
function incrementLocalStorageLimit(): void {
    const countStr = getItemFromStorage(GUEST_QUESTIONS_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    setItemToStorage(GUEST_QUESTIONS_COUNT_KEY, (count + 1).toString());
    // Устанавливаем срок хранения на 1 день
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 1);
    expiry.setHours(0, 0, 0, 0); // Сбрасываем на начало следующего дня
    setItemToStorage(`${GUEST_QUESTIONS_COUNT_KEY}_expiry`, expiry.toISOString());
}

/**
 * Обновляет историю чата гостя в localStorage.
 * @param question - Вопрос пользователя.
 * @param answer - Ответ ИИ.
 */
function updateLocalStorageHistory(question: string, answer: string): void {
    const historyStr = getItemFromStorage(GUEST_CHAT_HISTORY_KEY);
    let history: ChatHistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
    history.push({ question, answer, timestamp: new Date().toISOString() });
    // Ограничиваем историю, например, последними 10 сообщениями
    if (history.length > 10) {
        history = history.slice(-10);
    }
    setItemToStorage(GUEST_CHAT_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Получает историю чата гостя из localStorage.
 * @returns Массив элементов истории.
 */
export function getLocalStorageHistory(): ChatHistoryItem[] {
    const historyStr = getItemFromStorage(GUEST_CHAT_HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
}

/**
 * Очищает историю чата и счетчик вопросов гостя.
 */
export function clearLocalStorageChat(): void {
    removeItemFromStorage(GUEST_QUESTIONS_COUNT_KEY);
    removeItemFromStorage(GUEST_CHAT_HISTORY_KEY);
    removeItemFromStorage(`${GUEST_QUESTIONS_COUNT_KEY}_expiry`);
}


/**
 * Отправляет вопрос в ИИ-консультант через Edge Function `/ask`.
 * @param question - Текст вопроса.
 * @param userRole - Роль пользователя (Guest или Member).
 * @param sessionId - ID сессии чата (для членов СРО).
 * @param history - История чата (для контекста).
 * @returns Promise с ответом ИИ или выбрасывает ошибку.
 * @throws {Error} При ошибках запроса или превышении лимитов.
 */
export async function askAI(
    question: string,
    userRole: UserRole,
    sessionId: string | null,
    history: ChatHistoryItem[]
): Promise<{ answer: string; sessionId?: string }> {

    try {
        // 1. Проверка лимитов для гостей
        if (userRole === UserRole.Guest) {
            if (!checkGuestLimits()) {
                console.warn('Guest daily question limit exceeded.');
                throw new Error(`Вы превысили лимит вопросов в день (${LIMITS.GUEST_DAILY_QUESTIONS}). Пожалуйста, войдите как член СРО.`);
            }
        }

        // 2. Генерация или получение guestId для гостей
        let guestId: string | null = null;
        if (userRole === UserRole.Guest) {
            guestId = getItemFromStorage('guest_id') || null;
            if (!guestId) {
               // В AuthContext или при инициализации должно быть создано
               // Предполагаем, что guest_id уже есть или будет создано до вызова
               // Если нет, можно сгенерировать, но лучше из AuthContext
               console.warn('Guest ID not found for guest user.');
               // throw new Error('Guest ID not found.');
            }
        }

        // 3. Подготовка данных для запроса
        const requestBody: AskAIRequest = {
            question,
            guestId: userRole === UserRole.Guest ? guestId : undefined,
            sessionId: userRole === UserRole.Member ? sessionId : undefined,
            history: history.length > 0 ? history : undefined, // Передаем историю, если она есть
        };

        // --- РЕАЛЬНАЯ ЛОГИКА ---

        // 4. Вызов Edge Function через клиент Supabase
        const { data, error } = await supabase.functions.invoke('ask', {
            body: requestBody,
        });

        if (error) {
            console.error('Edge Function error in askAI:', error);
            // Можно различать ошибки от функции и сетевые ошибки
             if (!(error instanceof Error && error.message.startsWith('Ошибка ИИ-сервиса'))) {
                 // Сетевая ошибка или ошибка парсинга
                 throw new Error('Сервис ИИ-консультанта временно недоступен. Пожалуйста, попробуйте позже.');
             }
             // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
             throw error;
        }

        // 5. Проверка успешности ответа от функции
        if (!data || !data.success) {
             console.error('Edge Function returned failure:', data);
             throw new Error(data?.message || 'Не удалось получить ответ от ИИ-консультанта.');
        }

        // 6. Обновление локального состояния (лимиты, история) для гостей
        if (userRole === UserRole.Guest) {
            incrementLocalStorageLimit();
            updateLocalStorageHistory(question, data.answer);
        }

        // 7. Возврат результата
        // data.answer должен быть строкой
        // data.sessionId может быть новым ID сессии для членов
        return {
            answer: data.answer,
            sessionId: data.sessionId, // Может быть undefined, если не создавалась новая сессия
        };

        // - КОНЕЦ РЕАЛЬНОЙ ЛОГИКИ -

    } catch (error: any) {
         console.error('Unexpected error in askAI service:', error);
         // Если это не ошибка от Supabase Functions, это сетевая ошибка или ошибка парсинга
         if (!(error instanceof Error && error.message.startsWith('Ошибка ИИ-сервиса'))) {
             throw new Error('Сервис ИИ-консультанта временно недоступен. Пожалуйста, попробуйте позже.');
         }
         // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
         throw error;
    }
}
