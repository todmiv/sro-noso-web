// src/services/chatService.ts

import { createClient } from '@supabase/supabase-js'
import type {
  AskAIRequest,
  ChatHistoryItem,
  GuestChatMessage,
} from '../types/chat'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Получить историю чата гостя
export async function getGuestChatHistory(): Promise<GuestChatMessage[]> {
  const { data, error } = await supabase
    .from<GuestChatMessage>('chat_messages')
    .select('content, id, timestamp, user_id')

  if (error) {
    console.error('Error fetching guest chat history:', error)
    return []
  }
  return data
}

// Проверить, можно ли задать вопрос
export async function checkCanAskQuestion(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (error) {
    console.error('Error checking question permission:', error)
    return false
  }
  return data.length === 0
}

// Задать вопрос AI
export async function askAI(
  request: AskAIRequest
): Promise<ChatHistoryItem> {
  // Здесь должен быть реальный запрос к AI-сервису
  // Возвращаем заглушку для примера
  return {
    id: 'ai-response',
    content: `AI ответ на: ${request.content}`,
    timestamp: new Date().toISOString(),
    user_id: request.userId,
  }
}

