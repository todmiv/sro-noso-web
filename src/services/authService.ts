// src/services/authService.ts
import { AuthData } from '../types/auth'; // AuthData может остаться в auth.ts
import { LoginCredentials, UserProfile, UserRole } from '../types/user';
import { RegistryDataResponse } from '../types/auth';
import { supabase } from './supabaseClient';
import { isValidINN } from '../utils/helpers';
import * as Sentry from '@sentry/react';

// --- Константы ---
const LOGIN_ATTEMPTS_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 минут
/**
 * Фетчер данных из реестра СРО НОСО.
 * В реальной реализации это будет вызов Edge Function.
 * @param {string} inn - ИНН для проверки.
 * @returns {Promise<RegistryDataResponse>} Результат проверки.
 */
async function fetchRegistryData(inn: string): Promise<RegistryDataResponse> {
  try {
    const response = await fetch('/local_reestr.txt');
    if (!response.ok) {
      throw new Error('Failed to load registry file');
    }
    const text = await response.text();
    const lines = text.trim().split('\n');

    for (const line of lines) {
      const [status, fullName, registryInn, expDate] = line.split('\t');
      if (registryInn?.trim() === inn.trim()) {
        return {
          success: true,
          fullName: fullName.trim(),
          membershipStatus: status.trim(),
          membershipExpirationDate: expDate?.trim() || '',
          message: 'ИНН найден и действителен.',
        };
      }
    }

    return {
      success: false,
      message: 'ИНН не найден в реестре СРО',
    };
  } catch (error) {
    console.error('fetchRegistryData error:', error);
    throw new Error('Сервис проверки реестра временно недоступен');
  }
}
/**
 * Валидация лимитов попыток входа.
 * @param {string} inn - ИНН пользователя.
 * @returns {Promise<boolean>} True, если лимит не превышен.
 */
async function checkLoginAttemptLimit(inn: string): Promise<boolean> {
  const key = `login_attempts_${inn}`;
  const attemptsData = localStorage.getItem(key);
  const now = Date.now();

  let attempts: { timestamp: number }[] = [];

  if (attemptsData) {
    try {
      attempts = JSON.parse(attemptsData);
      // Очищаем старые попытки
      attempts = attempts.filter(a => now - a.timestamp < LOGIN_ATTEMPT_WINDOW_MS);
    } catch (e) {
      console.error('Error parsing login attempts from localStorage', e);
      localStorage.removeItem(key); // Очищаем поврежденные данные
    }
  }

  if (attempts.length >= LOGIN_ATTEMPTS_LIMIT) {
    const oldestAttempt = attempts[0];
    const timeUntilReset = LOGIN_ATTEMPT_WINDOW_MS - (now - oldestAttempt.timestamp);
    if (timeUntilReset > 0) {
      console.warn(`Login attempt limit exceeded for INN ${inn}. Try again in ${Math.ceil(timeUntilReset / 60000)} minutes.`);
      return false;
    } else {
      // Лимит истек, очищаем и разрешаем попытку
      localStorage.removeItem(key);
    }
  }

  // Записываем новую попытку
  attempts.push({ timestamp: now });
  localStorage.setItem(key, JSON.stringify(attempts));
  return true;
}

/**
 * Основная функция входа по ИНН.
 * Реализует сценарий 2.1 из ТЗ.
 * @param {string} inn - ИНН пользователя.
 * @returns {Promise<AuthData>} Данные аутентифицированного пользователя.
 */
export async function login({ inn }: LoginCredentials): Promise<AuthData> {
  try {
    // 1. Клиентская валидация ИНН
    if (!isValidINN(inn)) {
      throw new Error('Неверный формат ИНН. ИНН должен состоять из 10 или 12 цифр.');
    }

    // 2. Проверка лимитов попыток входа
    const isAllowed = await checkLoginAttemptLimit(inn);
    if (!isAllowed) {
      throw new Error(`Превышен лимит попыток входа. Повторите попытку через 15 минут.`);
    }

    // 3. Проверка ИНН в локальном реестре (local_reestr.txt)
    const registryData = await fetchRegistryData(inn);
    if (!registryData.success) {
      throw new Error(registryData.message || 'ИНН не найден в реестре СРО');
    }

    // 4. Регистрация или вход через Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email: `${inn}@noso.temp`,
      password: inn,
    });
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Ошибка регистрации');
    }

    // Небольшая задержка для синхронизации сессии
    await new Promise(resolve => setTimeout(resolve, 200));
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Не удалось создать сессию');
    }

    // 5. Проверка и обработка данных пользователя в таблице `users`
    let userData: UserProfile | null = null;
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error('Ошибка при проверке пользователя');
    }

    if (data) {
      // Обновление существующего пользователя
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          inn: inn,
          full_name: registryData.fullName,
          membership_status: registryData.membershipStatus,
          membership_exp: registryData.membershipExpirationDate,
          role: 'member',
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error('Не удалось обновить данные пользователя');
      }
      
      // Создаем валидный объект UserProfile с обработкой отсутствующих полей
      userData = {
        id: updateData.id,
        inn: updateData.inn,
        full_name: updateData.full_name,
        role: (updateData.role as UserRole) || 'member',
        membership_status: updateData.membership_status,
        membership_exp: updateData.membership_exp || '',
        recovery_email: (updateData as any)?.recovery_email ?? '',
        created_at: updateData.created_at || new Date().toISOString(),
        updated_at: (updateData as any)?.updated_at || new Date().toISOString()
      };
    } else {
      // Создание нового пользователя
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          inn: inn,
          full_name: registryData.fullName,
          membership_status: registryData.membershipStatus,
          membership_exp: registryData.membershipExpirationDate,
          role: 'member',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Не удалось создать пользователя');
      }
      
      userData = {
        id: insertData.id,
        inn: insertData.inn,
        full_name: insertData.full_name,
        role: (insertData.role as UserRole) || 'member',
        membership_status: insertData.membership_status,
        membership_exp: insertData.membership_exp || '',
        recovery_email: (insertData as any)?.recovery_email ?? '',
        created_at: insertData.created_at || new Date().toISOString(),
        updated_at: (insertData as any)?.updated_at || new Date().toISOString()
      };
    }

    // --- Исправление ошибки TS2739 ---
    // Убедимся, что объект userData (который будет user в AuthData) полностью соответствует интерфейсу UserProfile.
    // Даже если данные из БД не содержат recovery_email или updated_at, или они null,
    // мы предоставим значения по умолчанию.
    if (!userData) {
         throw new Error('Не удалось получить или создать профиль пользователя.');
    }

    // Убираем дублирующее создание userProfile из userData
    const userProfile = userData;
    // --- Конец исправления ---

    const authData: AuthData = {
      user: userProfile,
      accessToken: session?.access_token || '',
      refreshToken: session?.refresh_token || '',
    };

    return authData;
  } catch (error: any) {
    console.error('Login error:', error);
    Sentry.captureException(error); // Отправляем ошибку в Sentry
    // Пробрасываем ошибку, чтобы её можно было обработать в компоненте
    throw new Error(error.message || 'Ошибка авторизации');
  }
}

/**
 * Функция выхода пользователя.
 * @returns {Promise<void>}
 */
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err: any) {
    console.error('Logout error:', err);
    Sentry.captureException(err);
    // Можно пробросить ошибку, если нужно показать сообщение об ошибке выхода
    // throw new Error('Ошибка при выходе из системы');
  }
}

// Другие вспомогательные функции (если есть)...
// export async function getUserProfile(userId: string): Promise<UserProfile | null> { ... }
// export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> { ... }
