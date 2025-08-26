// src/hooks/useChat.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatHistoryItem, ChatRole } from '../types/chat';
import * as chatService from '../services/chatService';

const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isLimitExceeded, setIsLimitExceeded] = useState(false);

  // Load chat history
useEffect(() => {
  const checkLimit = async () => {
    if (user?.id) {
      const result = await chatService.checkCanAskQuestion(user.id);
      setIsLimitExceeded(!result.canAsk);
    } else {
      const result = await chatService.checkCanAskQuestion('');
      setIsLimitExceeded(!result.canAsk);
    }
  };
  checkLimit();
}, [user]);

useEffect(() => {
  const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const storedHistory = await chatService.getGuestChatHistory() || [];
        
        // Обеспечиваем корректное отображение истории
        const history = storedHistory.map((msg: any) => ({
          ...msg,
          role: msg.role || 'user' as ChatRole
        }));

        const messagesWithId = history.map(msg => ({
          id: msg.timestamp.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
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
  }, []);

  const clearError = () => setError(null);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const newMessage: ChatHistoryItem = {
        id: Date.now().toString(),
        role: ChatRole.USER,
        content,
        timestamp: new Date().toISOString()
      };

      // Optimistically add user message
      setMessages(prev => [...prev, newMessage]);

      // Get AI response
      const aiResponse = await chatService.askAI({
        question: content,
      });

      const aiMessage: ChatHistoryItem = {
        id: (Date.now() + 1).toString(),
        role: ChatRole.ASSISTANT,
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      };

      // Add AI response to chat history
      setMessages(prev => [...prev, aiMessage]);
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
    isLimitExceeded,
    sendMessage,
    clearError,
    maxQuestionLength: user?.role === 'guest' ? 500 : 2000
  };
};

export default useChat;
