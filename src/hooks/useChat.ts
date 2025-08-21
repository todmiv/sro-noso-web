// src/hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  askAI,
  getGuestChatHistory,
  saveGuestChatHistory,
  createChatSession,
  getChatHistory,
  saveChatMessage
} from '../services/chatService';
import {
  ChatHistoryItem,
  ChatMessage,
  ChatRole,
  GuestChatMessage,
  AskAIResponse
} from '../types/chat';
import { UserRole } from '../types/user';
import { LIMITS } from '../utils/constants';

/**
 * Пользовательский хук для управления логикой ИИ-консультанта и чата.
 *
 * Обрабатывает состояние чата, историю сообщений, лимиты и отправку вопросов.
 * Использует chatService для взаимодействия с API и localStorage.
 */

// --- Типы для состояния хука ---
interface UseChatState {
  /** Массив сообщений в чате */
  messages: ChatHistoryItem[];
  /** Флаг, указывающий, идет ли обработка запроса к ИИ */
  isLoading: boolean;
  /** Сообщение об ошибке, если она произошла */
  error: string | null;
  /** Флаг, указывающий, превышен ли суточный лимит запросов (для гостей) */
  isLimitExceeded: boolean;
  /** Текущий вопрос пользователя */
  currentQuestion: string;
}

/**
 * Хук для управления логикой чата ИИ-консультанта.
 *
 * @returns Объект состояния и методы управления.
 */
const useChat = (): UseChatState & {
  /** Функция для отправки вопроса ИИ */
  sendQuestion: (question: string) => Promise<void>;
  /** Функция для обновления текущего вопроса */
  setCurrentQuestion: (question: string) => void;
  /** Функция для очистки ошибок */
  clearError: () => void;
  /** Функция для проверки, доступен ли ввод (учитывает лимиты и загрузку) */
  isInputDisabled: boolean;
  /** Максимальная длина вопроса для текущего пользователя */
  maxQuestionLength: number;
} => {
  // Получаем данные пользователя из контекста аутентификации
  const { user, role } = useAuth();

  // Состояние хука
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');

  // Ref для хранения идентификатора сессии чата
  const sessionIdRef = useRef<string | null>(null);

  // --- Вычисляемые значения ---
  /** Максимальная длина вопроса в зависимости от роли */
  const maxQuestionLength = role === UserRole.Member ?
    LIMITS.MEMBER.AI_MAX_QUESTION_LENGTH :
    LIMITS.GUEST.AI_MAX_QUESTION_LENGTH;

  /** Флаг, указывающий, отключен ли ввод */
  const isInputDisabled = isLoading || isLimitExceeded || (role === UserRole.Guest && currentQuestion.length > maxQuestionLength);

  // --- Функции для управления состоянием ---

  /**
   * Очищает ошибки.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Загружает историю чата при монтировании и при изменении пользователя/роли.
   */
  const loadChatHistory = useCallback(async () => {
    try {
      if (role === UserRole.Guest) {
        // Для гостей загружаем историю из localStorage
        const guestHistory = getGuestChatHistory();
        setMessages(guestHistory);
        setIsLimitExceeded(false); // Сбросим флаг, так как лимит проверяется при отправке
      } else if (role === UserRole.Member && user) {
        // Для членов СРО загружаем историю из БД
        // Проверим, есть ли уже сессия
        if (!sessionIdRef.current) {
          // Простая логика: создаем новую сессию при каждой загрузке истории
          // Более сложная логика может включать получение последней сессии
          const newSession = await createChatSession(user.id, `Чат от ${new Date().toLocaleString('ru-RU')}`);
          sessionIdRef.current = newSession.id;
        }

        if (sessionIdRef.current) {
          const dbHistory = await getChatHistory(sessionIdRef.current);
          setMessages(dbHistory);
        }
      }
      // Для администратора можно не показывать историю или показывать пустую
    } catch (err: any) {
      console.error('Error loading chat history:', err);
      setError(err.message || 'Ошибка при загрузке истории чата.');
      setMessages([]); // Очищаем сообщения в случае ошибки загрузки
    }
  }, [role, user]);

  /**
   * Сохраняет сообщение в истории (в localStorage для гостей, в БД для членов).
   * @param message - Сообщение для сохранения.
   */
  const saveMessageToHistory = useCallback(async (message: ChatHistoryItem) => {
    if (role === UserRole.Guest) {
      // Для гостей сохраняем в localStorage
      const updatedHistory = [...messages, message];
      setMessages(updatedHistory);
      saveGuestChatHistory(updatedHistory);
    } else if (role === UserRole.Member && user && sessionIdRef.current) {
      // Для членов сохраняем в БД
      try {
        // Сохраняем сообщение в БД
        const savedMessage = await saveChatMessage(sessionIdRef.current, message.role, message.content);
        // Обновляем локальное состояние
        setMessages(prevMessages => [...prevMessages, savedMessage]);
      } catch (err: any) {
        console.error('Error saving message to DB:', err);
        setError(err.message || 'Ошибка при сохранении сообщения.');
        // Добавляем сообщение локально, даже если сохранение в БД не удалось
        setMessages(prevMessages => [...prevMessages, message]);
      }
    }
  }, [messages, role, user]);

  /**
   * Отправляет вопрос ИИ.
   * @param question - Вопрос пользователя.
   */
  const sendQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    // Очищаем предыдущие ошибки
    clearError();
    setIsLoading(true);
    setError(null);

    try {
      // Добавляем вопрос пользователя в историю
      const userMessage: ChatHistoryItem = role === UserRole.Guest ?
        { role: ChatRole.User, content: question, timestamp: Date.now() } :
        { role: ChatRole.User, content: question, session_id: sessionIdRef.current || '', id: `temp-${Date.now()}`, created_at: new Date().toISOString() };

      await saveMessageToHistory(userMessage);

      // Отправляем запрос ИИ
      const response: AskAIResponse = await askAI(
        question,
        role,
        user?.id || null,
        sessionIdRef.current,
        messages // Передаем всю текущую историю в запросе
      );

      if (response.success && response.answer) {
        // Обрабатываем успешный ответ
        const aiMessage: ChatHistoryItem = role === UserRole.Guest ?
          { role: ChatRole.Assistant, content: response.answer, timestamp: Date.now() } :
          { role: ChatRole.Assistant, content: response.answer, session_id: sessionIdRef.current || '', id: `temp-ai-${Date.now()}`, created_at: new Date().toISOString() };

        await saveMessageToHistory(aiMessage);

        // Если ИИ вернул новый sessionId (например, при первой отправке от члена)
        if (response.sessionId && role === UserRole.Member) {
          sessionIdRef.current = response.sessionId;
        }
      } else {
        // Обрабатываем ошибку от ИИ
        throw new Error(response.message || 'Не удалось получить ответ от ИИ.');
      }

    } catch (err: any) {
      console.error('Error in sendQuestion:', err);
      setError(err.message || 'Произошла ошибка при отправке вопроса.');
      
      // Добавляем сообщение об ошибке в чат для лучшего UX
      const errorMessage: ChatHistoryItem = role === UserRole.Guest ?
        { role: ChatRole.Assistant, content: `Ошибка: ${err.message || 'Неизвестная ошибка.'}`, timestamp: Date.now() } :
        { role: ChatRole.Assistant, content: `Ошибка: ${err.message || 'Неизвестная ошибка.'}`, session_id: sessionIdRef.current || '', id: `temp-error-${Date.now()}`, created_at: new Date().toISOString() };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentQuestion(''); // Очищаем поле ввода
    }
  }, [role, user, messages, clearError, saveMessageToHistory]);

  // --- Эффекты ---

  // Эффект для загрузки истории чата при монтировании и изменении пользователя/роли
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Эффект для проверки лимита гостя при изменении сообщений
  useEffect(() => {
    if (role === UserRole.Guest) {
      // Простая проверка: если в истории 3+ сообщения от пользователя, считаем лимит превышенным
      // Более точная проверка будет в chatService при отправке
      const userMessages = messages.filter(msg => msg.role === ChatRole.User);
      if (userMessages.length >= LIMITS.GUEST.AI_DAILY_QUESTIONS) {
        setIsLimitExceeded(true);
      } else {
        setIsLimitExceeded(false);
      }
    } else {
      // Для членов лимит не действует
      setIsLimitExceeded(false);
    }
  }, [messages, role]);

  // --- Возвращаемое значение ---

  return {
    // Состояние
    messages,
    isLoading,
    error,
    isLimitExceeded,
    currentQuestion,
    // Методы управления
    sendQuestion,
    setCurrentQuestion,
    clearError,
    // Вычисляемые значения
    isInputDisabled,
    maxQuestionLength,
  };
};

export default useChat;
