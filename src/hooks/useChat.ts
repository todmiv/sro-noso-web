import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatHistoryItem } from '../types/chat';
import * as chatService from '../services/chatService';

const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const history = await chatService.getGuestChatHistory();
        setMessages(history || []);
      } catch (err) {
        setError('Ошибка загрузки истории чата');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
  }, []);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newMessage: ChatHistoryItem = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      
      // Optimistically add user message
      setMessages(prev => [...prev, newMessage]);
      
      // Get AI response
      const aiResponse = await chatService.askAI({ content }, user?.role || 'guest');
      
      const aiMessage: ChatHistoryItem = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponse.answer,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
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
    sendMessage
  };
};

export default useChat;
