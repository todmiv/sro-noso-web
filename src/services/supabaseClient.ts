// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          inn: string;
        role: 'member' | 'guest' | 'admin';
          full_name: string | null;
          membership_exp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          inn: string;
          role?: string;
          full_name?: string | null;
          membership_exp?: string | null;
          created_at?: string;
          updated_at: string;
        };
        Update: {
          id?: string;
          inn?: string;
          role?: string;
          full_name?: string | null;
          membership_exp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

/**
 * Инициализация клиента Supabase.
 *
 * URL и анонимный ключ берутся из переменных окружения.
 * Они должны быть определены в .env файле.
 *
 * @see https://supabase.com/docs/guides/getting-started/tutorials/with-react
 */

// Убедимся, что переменные окружения определены
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined in the environment variables.');
}

if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined in the environment variables.');
}

/**
 * Экземпляр клиента Supabase.
 *
 * Используется для аутентификации, работы с базой данных и хранилищем.
 * Тип `Database` будет сгенерирован позже для строгой типизации запросов.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Экспорт клиента как named export для согласованности
export default supabase;
