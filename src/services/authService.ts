import { supabase } from './supabaseClient';
import { AuthData, LoginCredentials, UserProfile, UserRole } from '../types/user';
import { isValidINN } from '../utils/helpers';
import { getItemFromStorage, setItemToStorage } from '../utils/storageUtils';

// Конфигурация попыток входа
const FAILED_ATTEMPTS_KEY_PREFIX = 'failed_login_attempts_';
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 минут
const MAX_ATTEMPTS = 5;

function recordFailedAttempt(inn: string): void {
    const key = `${FAILED_ATTEMPTS_KEY_PREFIX}${inn}`;
    const now = Date.now();
    const attempts = getItemFromStorage<{ timestamp: number }[]>(key, []);
    const validAttempts = attempts.filter(attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS);
    validAttempts.push({ timestamp: now });
    setItemToStorage(key, validAttempts);
}

function isAttemptAllowed(inn: string): boolean {
    const key = `${FAILED_ATTEMPTS_KEY_PREFIX}${inn}`;
    const attempts = getItemFromStorage<{ timestamp: number }[]>(key, []);
    return attempts.length < MAX_ATTEMPTS;
}

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id, inn, full_name, membership_status, membership_exp, role, created_at')
      .eq('id', session.user.id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching current user:', error);
      return null;
    }


    const userData: UserProfile = {
      ...data,
      recovery_email: null,
      updated_at: data.created_at || new Date().toISOString(),
      role: (data.role as UserRole) || 'guest'
    };
    
    return userData;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
}
};

export async function login(credentials: LoginCredentials): Promise<AuthData> {
    const { inn } = credentials;

    if (!isValidINN(inn)) {
        throw new Error('Некорректный ИНН');
}

    if (!isAttemptAllowed(inn)) {
        throw new Error('Превышен лимит попыток входа');
    }

    try {
        // Вызов Edge Function для проверки ИНН
        const { data: registryData, error: registryError } = await supabase.functions.invoke('verify-inn', {
            body: { inn },
        });

        if (registryError) {
            recordFailedAttempt(inn);
            throw new Error(registryError.message || 'Ошибка проверки ИНН');
        }

        if (!registryData?.success) {
            recordFailedAttempt(inn);
            throw new Error(registryData?.message || 'ИНН не найден');
        }

        // Поиск или создание пользователя
        const { data: { session } } = await supabase.auth.getSession();
        let userData: UserProfile | null = null;

        if (session?.user?.id) {
            // Обновление существующего пользователя
            const { data, error } = await supabase
                .from('users')
                .update({
                    full_name: registryData.fullName,
                    membership_status: registryData.membershipStatus,
                    membership_exp: registryData.membershipExpirationDate
                })
                .eq('id', session.user.id)
                .select()
                .single();

            if (error) throw error;
            userData = {
              ...data,
              recovery_email: null,
              updated_at: data.created_at || new Date().toISOString(),
              role: (data.role as UserRole) || 'guest'
            };
        } else {
            // Создание нового пользователя
            const { data, error } = await supabase
                .from('users')
                .insert({
                    inn,
                    full_name: registryData.fullName,
                    membership_status: registryData.membershipStatus,
                    membership_exp: registryData.membershipExpirationDate,
                    role: registryData.membershipStatus === 'active' ? 'member' : 'guest'
                })
                .select()
                .single();

            if (error) throw error;
            userData = data;
        }

        if (!userData) {
            throw new Error('Не удалось создать пользователя');
        }

        return {
            user: userData,
            accessToken: session?.access_token || '',
            refreshToken: session?.refresh_token || ''
        };

    } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Ошибка авторизации');
    }
}

export async function logout(): Promise<void> {
    await supabase.auth.signOut();
}
