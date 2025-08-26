// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// 1. Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Проверяем, определены ли они
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.');
}

// 3. Создаем клиент только если переменные определены
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
  // Дополнительные опции клиента, если необходимы
  // {
  //   auth: { persistSession: true } // Пример
  // }
);

// 4. (Опционально) Экспортируем функцию для получения клиента, если нужна ленивая инициализация или дополнительная логика
// export const getSupabaseClient = () => {
//   // Повторная проверка или другая логика
//   return supabase;
// };