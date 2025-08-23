// src/services/authService.ts
import { supabase } from './supabaseClient';
import { AuthData, LoginCredentials, RegistryVerificationResponse, UserProfile, UserRole } from '../types/user';
import { isValidINN } from '../utils/helpers';
import { TIME } from '../utils/constants';
import { getItemFromStorage, setItemToStorage } from '../utils/storageUtils';

/**
 * Сервис аутентификации.
 * Содержит бизнес-логику для проверки ИНН через Edge Function,
 * управления сессией пользователя в Supabase и локальными ограничениями.
 */

const FAILED_ATTEMPTS_KEY_PREFIX = 'failed_login_attempts_';
const ATTEMPT_WINDOW_MS = 10 * TIME.MINUTE; // 10 минут

/**
 * Записывает неудачную попытку входа для конкретного ИНН в localStorage.
 * @param inn - ИНН, для которого записывается попытка.
 */
function recordFailedAttempt(inn: string): void {
    const key = `${FAILED_ATTEMPTS_KEY_PREFIX}${inn}`;
    const now = Date.now();
    const attempts = getItemFromStorage<{ timestamp: number }[]>(key) || [];
    // Удаляем устаревшие попытки
    const validAttempts = attempts.filter(attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS);
    // Добавляем новую попытку
    validAttempts.push({ timestamp: now });
    setItemToStorage(key, validAttempts);
}

/**
 * Проверяет, разрешена ли попытка входа для конкретного ИНН.
 * @param inn - ИНН для проверки.
 * @returns true, если попытка разрешена, false в противном случае.
 */
function isAttemptAllowed(inn: string): boolean {
    const key = `${FAILED_ATTEMPTS_KEY_PREFIX}${inn}`;
    const now = Date.now();
    const attempts = getItemFromStorage<{ timestamp: number }[]>(key) || [];
    const validAttempts = attempts.filter(attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS);
    return validAttempts.length < 5; // Максимум 5 попыток
}

/**
 * Проверяет локальное хранилище на наличие записей о неудачных попытках входа.
 * @param inn - ИНН для проверки.
 * @returns Количество неудавшихся попыток в последние 10 минут.
 */
function checkFailedAttempts(inn: string): number {
    const key = `${FAILED_ATTEMPTS_KEY_PREFIX}${inn}`;
    const now = Date.now();
    const attempts = getItemFromStorage<{ timestamp: number }[]>(key) || [];
    const validAttempts = attempts.filter(attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS);
    return validAttempts.length;
}


/**
 * Выполняет вход пользователя по ИНН.
 * 1. Проверяет ИНН на клиенте.
 * 2. Проверяет локальный лимит попыток.
 * 3. Вызывает Edge Function `/verify-inn` для проверки в реестре СРО.
 * 4. Если проверка успешна, создает/обновляет запись в таблице `users`.
 * 5. Получает/обновляет сессию Supabase Auth.
 * @param credentials - Данные для входа (ИНН).
 * @returns Promise с данными аутентификации (AuthData) или выбрасывает ошибку.
 */
export async function login(credentials: LoginCredentials): Promise<AuthData> {
    const { inn } = credentials;

    try {
        // 1. Валидация ИНН на клиенте
        if (!isValidINN(inn)) {
            throw new Error('Некорректный ИНН. ИНН должен состоять из 10 или 12 цифр.');
        }

        // 2. Проверка локального лимита попыток
        if (!isAttemptAllowed(inn)) {
            const attemptsCount = checkFailedAttempts(inn);
            console.warn(`Login attempt limit exceeded for INN ${inn}. Attempts: ${attemptsCount}`);
            throw new Error('Превышен лимит попыток входа. Пожалуйста, попробуйте позже.');
        }

        // --- РЕАЛЬНАЯ ЛОГИКА ---

        // 3. Вызов Edge Function `/verify-inn` для проверки в реестре
        const { data: registryData, error: registryError } = await supabase.functions.invoke('verify-inn', {
            body: { inn },
        });

        if (registryError) {
            console.error(`Supabase Function error for INN ${inn}:`, registryError);
            // Записываем неудачную попытку только если ошибка не от функции (например, сетевая)
            if (!(registryError instanceof Error && registryError.message.startsWith('Ошибка сервиса проверки ИНН'))) {
                 recordFailedAttempt(inn);
            }
            // Пробрасываем ошибку от функции как есть, если она есть
            if (registryError instanceof Error) {
                throw registryError;
            } else {
                throw new Error('Сервис проверки ИНН временно недоступен. Пожалуйста, попробуйте позже.');
            }
        }

        // Проверяем успешность проверки ИНН
        if (!registryData || !registryData.success) {
            // Ошибка уже записана и брошена в verifyINN
            // Записываем неудачную попытку, так как ИНН не найден в реестре
             recordFailedAttempt(inn);
            // Сообщение об ошибке должно прийти из Edge Function
             throw new Error(registryData?.message || 'ИНН не найден в реестре СРО НОСО.');
        }

        // 4. Получение или создание/обновление записи пользователя в Supabase
        let userData: UserProfile | null = null;
        let userId: string | undefined;

        // Получаем текущую сессию Supabase (если пользователь уже анонимно вошел или был залогинен)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        userId = currentSession?.user?.id;

        if (userId) {
            // Пользователь уже имеет активную сессию (например, анонимную), обновляем его данные
            const { data, error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: registryData.fullName,
                    role: 'member', // После успешной проверки всегда member
                    membership_status: registryData.membershipStatus,
                    membership_expiration_date: registryData.membershipExpirationDate,
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
            // Сначала пытаемся найти пользователя по ИНН
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('inn', registryData.inn)
                .maybeSingle(); // Используем maybeSingle для получения null, если не найдено

            if (fetchError) {
                console.error('Error fetching user by INN:', fetchError);
                throw new Error('Ошибка при поиске пользователя.');
            }

            if (existingUser) {
                // Пользователь существует, обновляем его данные
                const { data, error: updateError } = await supabase
                    .from('users')
                    .update({
                        full_name: registryData.fullName,
                        role: 'member',
                        membership_status: registryData.membershipStatus,
                        membership_expiration_date: registryData.membershipExpirationDate,
                    })
                    .eq('id', existingUser.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating existing user:', updateError);
                    throw new Error('Ошибка при обновлении данных пользователя.');
                }
                userData = data;
                userId = data.id;
            } else {
                // Пользователь новый, создаем запись
                // Предполагаем, что анонимная аутентификация используется и будет связана
                // или пользователь будет автоматически создан при первом действии.
                // Создаем запись в таблице `users`
                // Перед созданием записи, создаем анонимную сессию, если её нет
                // (Это может быть не обязательно, если Supabase сам создаст пользователя,
                // но для контроля лучше явно)
                // const { data: anonSessionData, error: anonSignInError } = await supabase.auth.signInAnonymously();
                // if (anonSignInError) {
                //     console.error('Error signing in anonymously:', anonSignInError);
                //     // Не критично, можно продолжить без анонимной сессии?
                //     // Или это ошибка?
                //     // throw new Error('Не удалось инициализировать сессию.');
                // }

                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        inn: registryData.inn,
                        full_name: registryData.fullName,
                        role: 'member', // После успешной проверки всегда member
                        membership_status: registryData.membershipStatus,
                        membership_expiration_date: registryData.membershipExpirationDate,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating new user:', insertError);
                    throw new Error('Ошибка при создании новой записи пользователя.');
                }
                userData = newUser;
                userId = newUser.id;
            }
        }

        // 5. Получение токенов сессии
        // Обычно Supabase автоматически управляет сессией после успешного upsert/insert
        // Но если нужно получить токены напрямую:
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Error getting session after login:', sessionError);
            // Это не критично для MVP, можно продолжить без токенов, если они не нужны напрямую
            // Но лучше убедиться, что сессия активна
        }

        if (!session) {
             console.warn('No active session found after login process.');
             // Возможно, нужно явно войти анонимно или как-то иначе активировать сессию?
             // Пока предположим, что userData достаточно
        }

        // 6. Возвращаем данные аутентификации
        const authData: AuthData = {
            user: userData,
            accessToken: session?.access_token || null,
            refreshToken: session?.refresh_token || null,
        };

        return authData;

        // - КОНЕЦ РЕАЛЬНОЙ ЛОГИКИ -

    } catch (error: any) {
        console.error('Error in verifyINNAndLogin service:', error);
        // Не записываем failed attempt здесь, так как ошибка не связана с проверкой ИНН в реестре
        // (кроме случая "ИНН не найден", который уже обработан выше)
        throw new Error(error.message || 'Произошла ошибка при входе в систему.');
    }
}

/**
 * Выполняет выход пользователя из системы.
 * @returns Promise.
 */
export async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error during logout:', error);
        // Можно пробросить ошибку, но часто выход всё равно считается успешным на клиенте
        // throw new Error('Ошибка при выходе из системы.');
    }
    // Состояние сессии будет обновлено через AuthStateChange listener в AuthContext
}
