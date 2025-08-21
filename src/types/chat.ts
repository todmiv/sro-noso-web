// src/types/chat.ts

/**
 * Типы данных, связанные с ИИ-консультантом и чатом.
 *
 * Основаны на схеме таблиц `chat_sessions` и `chat_messages` в Supabase (ТЗ, пункт 11),
 * а также на логике сценария 2.4.
 */

/**
 * Роль автора сообщения в чате.
 */
export enum ChatRole {
  /** Сообщение от пользователя */
  User = 'user',
  /** Сообщение от ассистента (ИИ) */
  Assistant = 'assistant',
}

/**
 * Интерфейс, представляющий сессию чата.
 * Соответствует структуре таблицы `chat_sessions` в Supabase.
 * Используется для авторизованных пользователей.
 */
export interface ChatSession {
  /** Уникальный идентификатор сессии (UUID) */
  id: string;
  /** Идентификатор пользователя (FK на users.id) */
  user_id: string;
  /** Название сессии (опционально) */
  title: string | null;
  /** Дата создания сессии */
  created_at: string; // Используем string для дат в формате ISO
  /** Дата последнего обновления сессии */
  updated_at: string; // Используем string для дат в формате ISO
}

/**
 * Интерфейс, представляющий сообщение в чате.
 * Соответствует структуре таблицы `chat_messages` в Supabase.
 * Используется для авторизованных пользователей.
 */
export interface ChatMessage {
  /** Уникальный идентификатор сообщения (UUID) */
  id: string;
  /** Идентификатор сессии (FK на chat_sessions.id) */
  session_id: string;
  /** Роль автора сообщения */
  role: ChatRole;
  /** Текст сообщения */
  content: string;
  /** Дата создания сообщения */
  created_at: string; // Используем string для дат в формате ISO
}

/**
 * Тип для сообщения в истории гостя.
 * Используется для хранения истории чата гостей в localStorage.
 * Упрощенная версия ChatMessage без ссылок на сессии и пользователей.
 */
export interface GuestChatMessage {
  /** Роль автора сообщения */
  role: ChatRole;
  /** Текст сообщения */
  content: string;
  /** Дата создания сообщения (timestamp) */
  timestamp: number; // Используем number для удобства хранения в localStorage
}

/**
 * Тип для запроса к Edge Function `/ask`.
 */
export interface AskAIRequest {
  /** Вопрос пользователя */
  question: string;
  /** Идентификатор гостя (для отслеживания лимитов) */
  guestId?: string;
  /** Идентификатор сессии (для авторизованных пользователей) */
  sessionId?: string;
  /** История сообщений (опционально, для контекста) */
  history?: (ChatMessage | GuestChatMessage)[];
}

/**
 * Тип для ответа от Edge Function `/ask`.
 */
export interface AskAIResponse {
  /** Ответ ассистента */
  answer: string;
  /** Идентификатор новой сессии (если была создана) */
  sessionId?: string;
  /** Новый список сообщений (включая вопрос и ответ) */
  messages?: ChatMessage[];
  /** Флаг успешности запроса */
  success: boolean;
  /** Сообщение об ошибке, если запрос не удался */
  message?: string;
}

/**
 * Тип для элемента истории чата, отображаемого в UI.
 * Может быть сообщением из БД или из localStorage гостя.
 */
export type ChatHistoryItem = ChatMessage | GuestChatMessage;

/**
 * Тип для параметров, влияющих на лимиты ИИ.
 */
export interface AILimits {
  /** Максимальная длина вопроса в символах */
  maxQuestionLength: number;
  /** Максимальная длина ответа в токенах */
  maxResponseTokens: number;
  /** Максимальное количество запросов в день (null для неограниченных) */
  dailyLimit: number | null;
}
