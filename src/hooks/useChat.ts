// src/hooks/useChat.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatHistoryItem, ChatRole, GuestChatMessage } from '../types/chat'; // Импортируем GuestChatMessage
import * as chatService from '../services/chatService';

const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        // Предполагаем, что getGuestChatHistory возвращает GuestChatMessage[]
        const history: GuestChatMessage[] = await chatService.getGuestChatHistory();

        // Преобразуем GuestChatMessage[] в ChatHistoryItem[]
        // Проблема была в том, что мы пытались передать объекты, не соответствующие ChatHistoryItem
        const messagesWithId: ChatHistoryItem[] = history.map(msg => ({
          // id: msg.id || msg.timestamp?.toString() || Date.now().toString(), // GuestChatMessage в текущем типе не имеет id
          id: msg.timestamp.toString(), // Используем timestamp как ID для гостей
          role: msg.role,
          content: msg.content,
          // timestamp в GuestChatMessage - это number, в ChatHistoryItem - string
          timestamp: new Date(msg.timestamp).toISOString(), // Преобразуем number в ISO string
          // user_id нет в ChatHistoryItem, убираем
        }));

        setMessages(messagesWithId);
      } catch (err) {
        setError('Ошибка загрузки истории чата');
        console.error("loadChatHistory error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, []); // Зависимости?

  const clearError = () => setError(null);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || isLimitExceeded) return;

    setIsLoading(true);
    setError(null);

    try {
      // В логике гостя проверка лимитов должна быть локальной, а не через БД
      // if (!user?.id) {
      //   setError('Пользователь не авторизован');
      //   setIsLoading(false);
      //   return;
      // }

      // Проверка лимитов для гостей (пример)
      // const guestLimit = ... // Получить из localStorage или другого места
      // if (guestLimit >= MAX_GUEST_QUESTIONS) {
      //   setIsLimitExceeded(true);
      //   setError('Превышен лимит вопросов для гостей');
      //   return;
      // }

      const newMessage: ChatHistoryItem = {
        id: Date.now().toString(), // Генерируем ID
        role: ChatRole.USER,
        content,
        timestamp: new Date().toISOString()
      };

      // Optimistically add user message
      setMessages(prev => [...prev, newMessage]);

      // Get AI response (заглушка)
      const aiResponse = await chatService.askAI({
        question: content,
        // guestId: ... // Передать guestId если нужно
      });

      const aiMessage: ChatHistoryItem = {
        id: (Date.now() + 1).toString(), // Генерируем ID
        role: ChatRole.ASSISTANT,
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      };

      // Add AI response to chat history
      setMessages(prev => [...prev, aiMessage]);

      // Сброс флага лимита, если пользователь стал членом (но это маловероятно для гостя)
      // if (isLimitExceeded && user?.role === 'member') {
      //   setIsLimitExceeded(false);
      // }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки сообщения');
      console.error("sendMessage error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    isLimitExceeded,
    maxQuestionLength: user?.role === 'guest' ? 500 : 2000
  };
};

export default useChat;
