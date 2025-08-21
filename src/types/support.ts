// src/types/support.ts

/**
 * Типы данных, связанные с системой обратной связи и поддержки.
 *
 * Основаны на схеме таблицы `support_tickets` в Supabase (ТЗ, пункт 11),
 * а также на логике сценария 2.6.
 */

/**
 * Темы обращения в службу поддержки.
 * Используются в выпадающем списке формы.
 */
export enum SupportTopic {
  /** Техническая проблема */
  TechnicalIssue = 'technical_issue',
  /** Предложение по улучшению */
  ImprovementSuggestion = 'improvement_suggestion',
  /** Вопрос по функциональности */
  FunctionalityQuestion = 'functionality_question',
  /** Другое */
  Other = 'other',
}

/**
 * Статус тикета поддержки.
 */
export enum SupportTicketStatus {
  /** Открыт */
  Open = 'open',
  /** В работе */
  InProgress = 'in_progress',
  /** Закрыт */
  Closed = 'closed',
}

/**
 * Интерфейс, представляющий тикет поддержки.
 * Соответствует структуре таблицы `support_tickets` в Supabase.
 */
export interface SupportTicket {
  /** Уникальный идентификатор тикета (UUID) */
  id: string;
  /** Email пользователя (опционально) */
  email: string | null;
  /** Тема обращения */
  topic: SupportTopic;
  /** Текст сообщения */
  message: string;
  /** URL скриншота в хранилище Supabase Storage (опционально) */
  screenshot: string | null;
  /** Статус тикета */
  status: SupportTicketStatus;
  /** Дата создания тикета */
  created_at: string; // Используем string для дат в формате ISO
}

/**
 * Тип для данных, отправляемых из формы обратной связи.
 * Используется при вызове Edge Function `/report-issue`.
 */
export interface SupportFormSubmission {
  /** Email пользователя */
  email?: string;
  /** Тема обращения */
  topic: SupportTopic;
  /** Текст сообщения */
  message: string;
  /** Файл скриншота (Blob или File) */
  screenshot?: Blob | File;
  /** Токен reCAPTCHA v3 */
  recaptchaToken?: string; // Опционально, так как может быть отложено
}

/**
 * Тип для результата отправки формы обратной связи.
 */
export interface SupportFormResponse {
  /** Флаг успешности отправки */
  success: boolean;
  /** Сообщение об ошибке, если отправка не удалась */
  message?: string;
  /** Идентификатор созданного тикета (если успешно) */
  ticketId?: string;
}
