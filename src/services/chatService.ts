// src/services/chatService.ts
import { supabase } from './supabaseClient'; // Используем глобальный клиент
import type {
  AskAIRequest,
  // ChatHistoryItem, // Не используем напрямую для типизации .from
  // GuestChatMessage, // Не используем напрямую для типизации .from
} from '../types/chat';
import type { Database } from '../types/database'; // Предполагается, что типы БД сгенерированы

/**
 * Получить историю чата для гостей.
 * Примечание: В текущей логике (useChat.ts) история гостей хранится в localStorage.
 * Эта функция может быть заглушкой или использоваться для получения
 * какой-либо общей истории из БД, если это предусмотрено.
 * @returns {Promise<Database['public']['Tables']['chat_messages']['Row'][] | null>} Массив сообщений или null при ошибке.
 */
export async function getGuestChatHistory(): Promise<Database['public']['Tables']['chat_messages']['Row'][] | null> {
  // В текущей логике (useChat.ts) история гостя загружается из localStorage.
  // Эта функция может быть использована, если в будущем потребуется
  // получать общую или публичную историю чатов из БД.
  // Пока возвращаем null или пустой массив как заглушку.
  console.warn('getGuestChatHistory: Реализация для получения истории гостя из БД отсутствует или не требуется.');
  
  try {
    // Пример использования правильной типизации .from (если таблица существует)
    // Вам нужно будет определить, как именно получать историю для гостей,
    // например, по session_id, guest_id или другому критерию.
    // const guestIdentifier = ...; // Получить идентификатор гостя
    // const { data, error } = await supabase
    //   .from<'chat_messages', Database['public']['Tables']['chat_messages']['Row']>('chat_messages')
    //   .select('*')
    //   .eq('some_guest_identifier_field', guestIdentifier);

    // if (error) {
    //   console.error('Error fetching guest chat history from DB:', error);
    //   return null;
    // }

    // return data;
    
    return []; // Возвращаем пустой массив как заглушку
  } catch (error) {
    console.error('Unexpected error in getGuestChatHistory:', error);
    return null;
  }
}

/**
 * Проверить, может ли пользователь задать вопрос (лимиты).
 * @param {string} userId - Идентификатор пользователя.
 * @returns {Promise<boolean>} True, если можно задать вопрос, иначе false.
 */
export async function checkCanAskQuestion(userId: string): Promise<boolean> {
  // TODO: Реализовать логику проверки лимитов.
  // Это может включать запрос к БД для подсчета запросов за день и сравнение с лимитом.
  // Для MVP можно вернуть true.
  console.warn('checkCanAskQuestion: Логика проверки лимитов не реализована.');
  return true;
}

/**
 * Отправить вопрос ИИ.
 * @param {AskAIRequest} request - Данные запроса.
 * @returns {Promise<any>} Ответ от ИИ (тип зависит от реализации).
 */
export async function askAI(request: AskAIRequest): Promise<any> {
  // --- Исправления ---
  // TS2339: В `AskAIRequest` поле называется `question`, не `content`.
  // TS2353: `ChatHistoryItem` (возвращаемый объект) не имеет поля `user_id`.
  // --- Конец исправлений ---

  try {
    // === Заглушка для демонстрации ===
    console.log('askAI: Отправка запроса к ИИ (заглушка)', request);
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Имитация ответа
    // Исправление TS2339: используем request.question
    const mockAnswer = `Это имитационный ответ ИИ на ваш вопрос: "${request.question}". В реальной системе здесь будет ответ, сгенерированный моделью искусственного интеллекта.`;

    // Возвращаем объект, который соответствует ожиданиям вызывающего кода
    // (например, в useChat.ts или ChatInterface.tsx)
    return {
      // id: 'ai-response', // ID может генерироваться позже или не быть нужен на этом уровне
      // Исправление TS2339: используем правильное имя поля
      content: mockAnswer,
      timestamp: new Date().toISOString(),
      // Исправление TS2353: Убираем user_id, так как его нет в ChatHistoryItem
      // user_id: request.userId,
      // Добавляем role, если это ожидается (например, для отображения в Message.tsx)
      role: 'assistant', // Предполагаем, что 'assistant' это допустимое значение ChatRole
      // Добавляем id, если он нужен (например, как ключ в списке React)
      id: `ai-${Date.now()}`, // Простая генерация ID
    };
    // === Конец заглушки ===

  } catch (err: any) {
    console.error('askAI: Ошибка при отправке запроса:', err);
    return {
      success: false,
      content: '', // Используем content для совместимости с ожидаемым форматом в useChat.ts
      role: 'assistant',
      timestamp: new Date().toISOString(),
      id: `ai-error-${Date.now()}`,
      message: err.message || 'Неизвестная ошибка при обращении к ИИ.',
    };
  }
}

// --- Ниже идут функции, которые могут понадобиться в будущем или как заглушки ---
// (Остальные функции, если есть, остаются без изменений или добавляются по необходимости,
// используя правильную типизацию .from при работе с БД)