import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, User } from '../types/database';

type ChatRole = 'user' | 'assistant';

interface ChatHistoryItem extends ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Загрузка истории чата
  const loadChatHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      // Заглушка для реализации
      const mockHistory: ChatHistoryItem[] = [
        { 
          id: '1', 
          role: 'assistant', 
          content: 'Чем могу помочь?',
          user_id: user.id,
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(mockHistory);
    } catch (err) {
      setError('Ошибка загрузки истории');
    }
  }, [user]);

  // Отправка сообщения
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    try {
      // Добавление сообщения пользователя
      const userMessage: ChatHistoryItem = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        user_id: user?.id || 'guest',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Заглушка для ответа ИИ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: ChatHistoryItem = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Ответ на: "${content}"`,
        user_id: 'ai-system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError('Ошибка отправки сообщения');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
};

export default useChat;
