// src/services/authService.ts
import { supabase } from './supabaseClient';
import { AuthData, LoginCredentials, RegistryVerificationResponse, UserProfile, UserRole } from '../types/user';
import { isValidINN } from '../utils/helpers';
import { TIME } from '../utils/constants';
import { getItemFromStorage, setItemToStorage } from '../utils/storageUtils';

/**
 * Сервис аутентификации.
 *
 * Содержит бизнес-логику для проверки ИНН через Edge Function,
 * управления сессией пользователя в Supabase и локальными ограничениями.
 */

// --- Типы для локального хранилища попыток входа ---
interface LoginAttempt {
  count: number;
  lastAttempt: number; // Timestamp
}

// --- Константы для логики попыток ---
const LOGIN_ATTEMPTS_STORAGE_KEY = 'sro-noso-login-attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_TIME_MS = TIME.LOGIN_ATTEMPT_BLOCK_TIME_MS; // 10 минут из constants.ts

/**
 * Проверяет, заблокирован ли вход по ИНН из-за превышения лимита попыток.
 * @param inn - ИНН пользователя.
 * @returns true, если вход заблокирован, иначе false.
 */
function isLoginBlocked(inn: string): boolean {
  const attemptsData = getItemFromStorage<Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_STORAGE_KEY, {});
  const attempt = attemptsData[inn];

  if (!attempt) {
    return false; // Нет попыток - не заблокирован
  }

  const now = Date.now();
  const timeSinceLastAttempt = now - attempt.lastAttempt;

  // Если блокировка истекла, разблокируем
  if (timeSinceLastAttempt > BLOCK_TIME_MS) {
    // Опционально: можно очистить старые записи
    return false;
  }

  // Заблокирован, если попыток >= MAX_LOGIN_ATTEMPTS и время блокировки не истекло
  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Записывает неудачную попытку входа.
 * @param inn - ИНН пользователя.
 */
function recordFailedAttempt(inn: string): void {
  const attemptsData = getItemFromStorage<Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_STORAGE_KEY, {});
  const now = Date.now();
  const currentAttempt = attemptsData[inn];

  let newCount = 1;
  if (currentAttempt && (now - currentAttempt.lastAttempt) < BLOCK_TIME_MS) {
    // Если попытка была недавно и блокировка еще не истекла, увеличиваем счетчик
    newCount = currentAttempt.count + 1;
  }
  // Если блокировка истекла или это первая попытка, начинаем с 1

  attemptsData[inn] = {
    count: newCount,
    lastAttempt: now,
  };

  setItemToStorage(LOGIN_ATTEMPTS_STORAGE_KEY, attemptsData);
}

/**
 * Сбрасывает счетчик попыток входа после успешного входа.
 * @param inn - ИНН пользователя.
 */
function resetLoginAttempts(inn: string): void {
  const attemptsData = getItemFromStorage<Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_STORAGE_KEY, {});
  if (attemptsData[inn]) {
    delete attemptsData[inn];
    setItemToStorage(LOGIN_ATTEMPTS_STORAGE_KEY, attemptsData);
  }
}

/**
 * Проверяет ИНН через Edge Function `/verify-inn`.
 * Взаимодействует с официальным реестром СРО.
 *
 * @param inn - ИНН для проверки.
 * @returns Promise с результатом проверки.
 * @throws {Error} При сетевых ошибках или ошибках на стороне сервера.
 */
export async function verifyINN(inn: string): Promise<RegistryVerificationResponse> {
  // Базовая клиентская валидация
  if (!inn || !isValidINN(inn)) {
    throw new Error('Неверный формат ИНН. ИНН должен состоять из 10 или 12 цифр.');
  }

  // Проверка локальной блокировки
  if (isLoginBlocked(inn)) {
      throw new Error(`Превышено количество попыток входа. Повторите попытку через ${Math.ceil(BLOCK_TIME_MS / (60 * 1000))} минут.`);
  }

  try {
    // Вызов Edge Function через клиент Supabase
    // Предполагается, что функция называется 'verify-inn'
    const { data, error } = await supabase.functions.invoke('verify-inn', {
      body: { inn: inn },
    });

    if (error) {
      console.error(`Edge Function error for INN ${inn}:`, error);
      // Записываем неудачную попытку при ошибке сервера
      recordFailedAttempt(inn);
      throw new Error(`Ошибка сервиса проверки ИНН: ${error.message || 'Неизвестная ошибка.'}`);
    }

    // Предполагаем, что `data` соответствует интерфейсу `RegistryVerificationResponse`
    const response: RegistryVerificationResponse = data as RegistryVerificationResponse;

    if (!response.success) {
        // Записываем неудачную попытку, если ИНН не прошел проверку по бизнес-логике
        recordFailedAttempt(inn);
        // Сообщение об ошибке приходит от Edge Function
        throw new Error(response.message || 'Проверка ИНН не пройдена.');
    }

    // Если проверка успешна, сбрасываем попытки
    resetLoginAttempts(inn);

    return response;

  } catch (error: any) {
    // Если это не ошибка от Supabase Functions, это сетевая ошибка или ошибка парсинга
    if (!(error instanceof Error && error.message.startsWith('Ошибка сервиса проверки ИНН'))) {
        console.error(`Network or unexpected error for INN ${inn}:`, error);
        recordFailedAttempt(inn);
        throw new Error('Сервис проверки ИНН временно недоступен. Пожалуйста, попробуйте позже.');
    }
    // Если это уже обработанная ошибка от Supabase/Edge Function, просто пробрасываем её
    throw error;
  }
}

/**
 * Проверяет ИНН и выполняет вход в систему.
 * Создаёт или обновляет запись пользователя в таблице `users`.
 *
 * @param credentials - Данные для входа (ИНН).
 * @returns Promise с данными аутентифицированного пользователя или null при ошибке.
 * @throws {Error} При ошибках валидации, проверки ИНН или аутентификации.
 */
export async function verifyINNAndLogin(credentials: LoginCredentials): Promise<AuthData | null> {
  const { inn } = credentials;

  // 1. Проверка ИНН через Edge Function
  const registryData = await verifyINN(inn);

  if (!registryData.success) {
    // Ошибка уже записана и брошена в verifyINN
    return null;
  }

  // 2. Получение или создание/обновление записи пользователя в Supabase
  try {
    // Получаем текущего пользователя из сессии Supabase (если есть)
    // Это нужно для корректного обновления существующего пользователя
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    let userId = currentSession?.user?.id;

    let userData: UserProfile;

    if (userId) {
      // Пользователь уже залогинен (например, через анонимный вход или предыдущую сессию)
      // Обновляем существующую запись
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          inn: registryData.inn,
          full_name: registryData.fullName,
          role: UserRole.Member, // Успешная проверка = член СРО
          membership_exp: registryData.membershipExpirationDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating existing user:', updateError);
        throw new Error('Ошибка при обновлении данных пользователя.');
      }
      userData = data;
    } else {
      // Нет активной сессии, нужно создать нового пользователя или найти существующего по ИНН
      // В Supabase можно использовать upsert, но для большего контроля делаем отдельно

      // Сначала пытаемся найти пользователя по ИНН
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('inn', registryData.inn)
        .maybeSingle(); // maybeSingle позволяет получить null, если запись не найдена

      if (fetchError) {
        console.error('Error fetching user by INN:', fetchError);
        throw new Error('Ошибка при поиске пользователя.');
      }

      if (existingUser) {
        // Пользователь существует, обновляем его данные
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            full_name: registryData.fullName,
            role: UserRole.Member,
            membership_exp: registryData.membershipExpirationDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating existing user by INN:', updateError);
          throw new Error('Ошибка при обновлении данных существующего пользователя.');
        }
        userData = updatedUser;
        userId = updatedUser.id;
      } else {
        // Пользователь новый, создаем запись
        // Сначала создаем анонимную сессию в Supabase Auth (если это разрешено политиками)
        // Или можно использовать signUp с уникальным email/паролем, но это не по ТЗ
        // Предположим, что пользователь будет создан автоматически при первом успешном входе
        // и связан с записью в таблице `users` через UUID.

        // Создаем запись в таблице `users`
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            inn: registryData.inn,
            full_name: registryData.fullName,
            role: UserRole.Member,
            membership_exp: registryData.membershipExpirationDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // id будет сгенерирован автоматически, если не указан
          })
          .select()
          .single();

        if (insertError) {
            console.error('Error inserting new user:', insertError);
            throw new Error('Ошибка при создании новой записи пользователя.');
        }
        userData = newUser;
        userId = newUser.id;
      }
    }

    // 3. Получение токенов сессии (если нужно явно)
    // Обычно Supabase автоматически управляет сессией после успешного upsert/insert
    // Но если нужно получить токены напрямую:
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error getting session after login:', sessionError);
        // Это не критично для MVP, можно продолжить без токенов
    }

    // 4. Возвращаем данные аутентификации
    const authData: AuthData = {
      user: userData,
      accessToken: session?.access_token || null,
      refreshToken: session?.refresh_token || null,
    };

    return authData;

  } catch (error: any) {
    console.error('Error in verifyINNAndLogin service:', error);
    // Не записываем failed attempt здесь, так как ошибка не связана с проверкой ИНН в реестре
    throw new Error(error.message || 'Произошла ошибка при входе в систему.');
  }
}

/**
 * Выполняет выход пользователя из системы.
 * @returns Promise<void>.
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error during logout:', error);
    throw new Error('Ошибка при выходе из системы.');
  }
  // Состояние аутентификации в контексте будет обновлено слушателем событий Supabase
  // или вызовом соответствующего метода в AuthContext
}

// Экспорт всех функций как named exports
// export { verifyINN, verifyINNAndLogin, logout };
