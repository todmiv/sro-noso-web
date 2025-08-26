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
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const history = await chatService.getGuestChatHistory();
        const messagesWithId = history?.map(msg => ({
          ...msg,
          id: msg.id || msg.timestamp?.toString() || Date.now().toString(),
          timestamp: typeof msg.timestamp === 'number' 
            ? new Date(msg.timestamp).toISOString() 
            : msg.timestamp || new Date().toISOString()
        })) || [];
        setMessages(messagesWithId);
      } catch (err) {
        setError('Ошибка загрузки истории чата');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
  }, []);

  const clearError = () => setError(null);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || isLimitExceeded) return;
    
    setIsLoading(true);
    setError(null);
    
    if (!user?.id) {
      setError('Пользователь не авторизован');
      setIsLoading(false);
      return;
    }

    try {
      // Check limits before sending
      const canAsk = await chatService.checkCanAskQuestion(user.id);
      if (!canAsk) {
        setIsLimitExceeded(true);
        setError('Превышен лимит вопросов');
        return;
      }
      
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
        question: content
      });
      
      const aiMessage: ChatHistoryItem = {
        id: (Date.now() + 1).toString(),
        role: ChatRole.ASSISTANT,
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      };
      
      // Add AI response to chat history
      setMessages(prev => [...prev, aiMessage]);
      
      // Reset limit flag if user is member
      if (isLimitExceeded && user?.role === 'member') {
        setIsLimitExceeded(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки сообщения');
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
