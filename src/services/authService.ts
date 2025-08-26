// src/services/authService.ts
import { AuthData } from '../types/auth'; // AuthData может остаться в auth.ts
import { LoginCredentials, RegistryDataResponse, UserProfile, UserRole } from '../types/user'; // Остальные из user.ts
import { supabase } from './supabaseClient';
import { isValidINN } from '../utils/helpers';
import * as Sentry from '@sentry/react';

// --- Константы ---
const LOGIN_ATTEMPTS_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 минут

/**
 * Фетчер данных из реестра СРО НОСО.
 * В реальной реализации это будет вызов Edge Function.
 * @param {string} inn - ИНН для проверки.
 * @returns {Promise<RegistryDataResponse>} Результат проверки.
 */
async function fetchRegistryData(inn: string): Promise<RegistryDataResponse> {
  try {
    // === Заглушка для демонстрации ===
    console.log(`Fetching registry data for INN: ${inn} (stub)`);
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Имитация успешного ответа
    if (['7708501511', '7706107788', '7727629890'].includes(inn)) {
      return {
        success: true,
        fullName: `ООО "Фирма ${inn.slice(-3)}"`,
        membershipStatus: 'active',
        membershipExpirationDate: '2027-12-31',
        message: 'ИНН найден и действителен.',
      };
    }

    // Имитация ответа "не найден"
    return {
      success: false,
      message: 'ИНН не найден в реестре СРО НОСО. Пожалуйста, проверьте корректность введенных данных или свяжитесь с нами для уточнения.',
    };
    // === Конец заглушки ===

    // TODO: Заменить на реальный вызов Edge Function
    /*
    const { data, error } = await supabase.functions.invoke('verify-inn', {
      body: { inn: inn },
    });

    if (error) {
      console.error('Error calling Edge Function verify-inn:', error);
      // Возвращаем специфичную ошибку, которую можно отличить
      throw new Error(`Ошибка сервиса проверки ИНН: ${error.message || 'Неизвестная ошибка'}`);
    }

    // Предполагаем, что ответ от Edge Function соответствует RegistryDataResponse
    return data as RegistryDataResponse;
    */
  } catch (err: any) {
    console.error('fetchRegistryData: Ошибка при вызове сервиса:', err);
    // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
    if (err.message.startsWith('Ошибка сервиса проверки ИНН:')) {
      throw err;
    }
    // Если это сетевая ошибка или ошибка парсинга, возвращаем общую ошибку
    throw new Error('Сервис проверки ИНН временно недоступен. Пожалуйста, попробуйте позже.');
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

    // 3. Вызов Edge Function для проверки ИНН в реестре СРО
    const { registryData, error: registryError } = await fetchRegistryData(inn);
    if (registryError || !registryData) {
      throw new Error(registryData?.message || 'ИНН не найден');
    }

    // 4. Получение текущей сессии Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error('Ошибка получения сессии аутентификации.');
    }

    // 5. Проверка, существует ли пользователь в таблице `users`
    let userData: UserProfile | null = null;
    if (session?.user?.id) {
      // a. Пользователь уже аутентифицирован (например, через OAuth или email)
      // Обновляем его данные
      const { data, error } = await supabase
        .from('users')
        .update({
          inn: inn, // Убедиться, что ИНН обновляется/сохраняется
          full_name: registryData.fullName,
          membership_status: registryData.membershipStatus,
          membership_exp: registryData.membershipExpirationDate,
          // role будет установлен ниже или останется существующим
          // recovery_email и updated_at обрабатываются ниже
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        // Проверим, если пользователь не найден (например, запись была удалена), создаем новую
        if (error.code === 'PGRST116') { // Код ошибки PostgREST для "Row not found"
             console.warn('User not found during update, attempting to create...');
             // Переходим к блоку создания
        } else {
             throw new Error('Не удалось обновить данные пользователя');
        }
      } else {
        userData = data;
      }
    }

    // Если userData не была получена (новый пользователь или не найден при обновлении)
    if (!userData && session?.user?.id) {
      // b. Создание новой записи пользователя
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: session.user.id, // ID из сессии Supabase Auth
            inn: inn,
            full_name: registryData.fullName,
            membership_status: registryData.membershipStatus,
            membership_exp: registryData.membershipExpirationDate,
            role: 'member', // Предполагаем, что успешный вход делает пользователя членом
            // recovery_email и updated_at будут установлены значениями по умолчанию ниже
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        throw new Error('Не удалось создать пользователя');
      }
      userData = data;
    }

    // --- Исправление ошибки TS2739 ---
    // Убедимся, что объект userData (который будет user в AuthData) полностью соответствует интерфейсу UserProfile.
    // Даже если данные из БД не содержат recovery_email или updated_at, или они null,
    // мы предоставим значения по умолчанию.
    if (!userData) {
         throw new Error('Не удалось получить или создать профиль пользователя.');
    }

    const userProfile: UserProfile = {
      id: userData.id,
      inn: userData.inn,
      full_name: userData.full_name,
      role: (userData.role as UserRole) || UserRole.Guest, // Приведение типа и значение по умолчанию
      membership_exp: userData.membership_exp,
      membership_status: userData.membership_status,
      // Обработка обязательных полей, которые могут отсутствовать или быть null в ответе БД
      recovery_email: userData.recovery_email ?? '', // Значение по умолчанию, если null или undefined
      created_at: userData.created_at || new Date().toISOString(), // Значение по умолчанию
      updated_at: userData.updated_at || new Date().toISOString() // Значение по умолчанию
    };
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
