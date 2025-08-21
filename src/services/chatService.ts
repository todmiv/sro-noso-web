// src/services/chatService.ts
import { supabase } from './supabaseClient';
import { useAuth } from '../context/AuthContext'; // Для определения роли и данных пользователя
import {
  AskAIRequest,
  AskAIResponse,
  ChatMessage,
  ChatRole,
  ChatSession,
  GuestChatMessage
} from '../types/chat';
import { UserRole } from '../types/user';
import { LIMITS } from '../utils/constants';
import { getOrCreateGuestId, getItemFromStorage, setItemToStorage } from '../utils/storageUtils';
import { formatDateTime } from '../utils/helpers';

/**
 * Сервис для работы с ИИ-консультантом и чатом.
 *
 * Содержит логику для отправки вопросов в Edge Function `/ask`,
 * управления историей сообщений и проверки лимитов.
 */

const GUEST_CHAT_HISTORY_KEY = 'sro-noso-guest-chat-history';
const DAILY_LIMITS_TABLE = 'daily_limits';

/**
 * Проверяет, не превышен ли суточный лимит запросов для гостя.
 * Использует таблицу `daily_limits` в Supabase.
 *
 * @param guestId - Идентификатор гостя.
 * @returns Promise<boolean> - true, если лимит превышен, иначе false.
 */
export async function isGuestDailyLimitExceeded(guestId: string): Promise<boolean> {
  try {
    // Вызываем серверную функцию Supabase для проверки и инкремента счётчика
    // Предполагается, что функция `increment_guest_question` существует и возвращает
    // { is_limit_exceeded: boolean }
    const { data, error } = await supabase.rpc('increment_guest_question', { guest_id: guestId });

    if (error) {
        console.error('Error checking guest daily limit:', error);
        // В случае ошибки сервера, можно либо заблокировать, либо разрешить.
        // Для надежности лучше заблокировать.
        return true;
    }

    // Предполагаем, что RPC возвращает объект с полем is_limit_exceeded
    return data?.is_limit_exceeded ?? true; // Если data undefined, считаем лимит превышенным

  } catch (error) {
    console.error('Unexpected error in isGuestDailyLimitExceeded:', error);
    // В случае неожиданной ошибки, блокируем
    return true;
  }
}

/**
 * Получает историю чата для гостя из localStorage.
 *
 * @returns Массив сообщений гостя.
 */
export function getGuestChatHistory(): GuestChatMessage[] {
  return getItemFromStorage<GuestChatMessage[]>(GUEST_CHAT_HISTORY_KEY, []);
}

/**
 * Сохраняет историю чата гостя в localStorage.
 *
 * @param history - Массив сообщений для сохранения.
 */
export function saveGuestChatHistory(history: GuestChatMessage[]): void {
  // Ограничиваем историю, например, последними 20 сообщениями, чтобы не переполнять localStorage
  const limitedHistory = history.slice(-20);
  setItemToStorage(GUEST_CHAT_HISTORY_KEY, limitedHistory);
}

/**
 * Отправляет вопрос ИИ через Edge Function `/ask`.
 *
 * @param question - Вопрос пользователя.
 * @param userRole - Роль текущего пользователя.
 * @param userId - Идентификатор пользователя (для членов).
 * @param sessionId - Идентификатор сессии чата (для членов).
 * @param history - История сообщений (для контекста).
 * @returns Promise с ответом от ИИ.
 * @throws {Error} При ошибках запроса или превышении лимитов.
 */
export async function askAI(
  question: string,
  userRole: UserRole,
  userId: string | null,
  sessionId: string | null,
  history: (ChatMessage | GuestChatMessage)[]
): Promise<AskAIResponse> {

  // 1. Проверка длины вопроса
  const maxLength = userRole === UserRole.Member ?
    LIMITS.MEMBER.AI_MAX_QUESTION_LENGTH :
    LIMITS.GUEST.AI_MAX_QUESTION_LENGTH;

  if (question.length > maxLength) {
    throw new Error(`Вопрос слишком длинный. Максимальная длина: ${maxLength} символов.`);
  }

  let guestId: string | undefined;

  // 2. Проверка лимитов для гостей
  if (userRole === UserRole.Guest) {
    guestId = getOrCreateGuestId();
    const isLimitExceeded = await isGuestDailyLimitExceeded(guestId);
    if (isLimitExceeded) {
      throw new Error(`Превышен суточный лимит вопросов ИИ. Попробуйте снова завтра.`);
    }
  }

  // 3. Подготовка данных для запроса
  const requestBody: AskAIRequest = {
    question,
    guestId: userRole === UserRole.Guest ? guestId : undefined,
    sessionId: userRole === UserRole.Member ? sessionId : undefined,
    history: history.length > 0 ? history : undefined, // Передаем историю, если она есть
  };

  try {
    // 4. Вызов Edge Function через клиент Supabase
    const { data, error } = await supabase.functions.invoke('ask', {
      body: requestBody,
    });

    if (error) {
      console.error('Edge Function error in askAI:', error);
      throw new Error(`Ошибка сервиса ИИ: ${error.message || 'Неизвестная ошибка.'}`);
    }

    // Предполагаем, что `data` соответствует интерфейсу `AskAIResponse`
    const response: AskAIResponse = data as AskAIResponse;

    if (!response.success) {
        // Сообщение об ошибке приходит от Edge Function
        throw new Error(response.message || 'Запрос к ИИ не удался.');
    }

    return response;

  } catch (error: any) {
    // Если это не ошибка от Supabase Functions, это сетевая ошибка или ошибка парсинга
    if (!(error instanceof Error && error.message.startsWith('Ошибка сервиса ИИ'))) {
        console.error('Network or unexpected error in askAI:', error);
        throw new Error('Сервис ИИ временно недоступен. Пожалуйста, попробуйте позже.');
    }
    // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
    throw error;
  }
}

/**
 * Создает новую сессию чата в БД для авторизованного пользователя.
 *
 * @param userId - Идентификатор пользователя.
 * @param initialTitle - Начальное название сессии (опционально).
 * @returns Promise с данными новой сессии.
 * @throws {Error} При ошибках создания сессии.
 */
export async function createChatSession(userId: string, initialTitle?: string): Promise<ChatSession> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: initialTitle || `Чат от ${formatDateTime(new Date())}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Ошибка при создании сессии чата.');
    }

    return data;

  } catch (error: any) {
    console.error('Unexpected error in createChatSession:', error);
    throw new Error(error.message || 'Произошла ошибка при создании сессии чата.');
  }
}

/**
 * Сохраняет сообщение чата в БД для авторизованного пользователя.
 *
 * @param sessionId - Идентификатор сессии.
 * @param role - Роль автора сообщения.
 * @param content - Текст сообщения.
 * @returns Promise с данными нового сообщения.
 * @throws {Error} При ошибках сохранения сообщения.
 */
export async function saveChatMessage(
  sessionId: string,
  role: ChatRole,
  content: string
): Promise<ChatMessage> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Ошибка при сохранении сообщения чата.');
    }

    return data;

  } catch (error: any) {
    console.error('Unexpected error in saveChatMessage:', error);
    throw new Error(error.message || 'Произошла ошибка при сохранении сообщения чата.');
  }
}

/**
 * Получает историю сообщений для сессии чата из БД.
 *
 * @param sessionId - Идентификатор сессии.
 * @returns Promise с массивом сообщений.
 * @throws {Error} При ошибках получения истории.
 */
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }); // Сортируем по возрастанию даты создания

    if (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Ошибка при загрузке истории чата.');
    }

    return data || [];

  } catch (error: any) {
    console.error('Unexpected error in getChatHistory:', error);
    throw new Error(error.message || 'Произошла ошибка при загрузке истории чата.');
  }
}

// Экспорт всех функций как named exports
// export {
//   isGuestDailyLimitExceeded,
//   getGuestChatHistory,
//   saveGuestChatHistory,
//   askAI,
//   createChatSession,
//   saveChatMessage,
//   getChatHistory,
// };
