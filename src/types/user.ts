// src/types/user.ts

/**
 * Типы данных, связанные с пользователем и аутентификацией.
 *
 * Основаны на схеме таблицы `users` в Supabase (ТЗ, пункт 11).
 */

/**
 * Роли пользователя в системе.
 * Определяет уровень доступа и доступные функции.
 */
export enum UserRole {
  Guest = 'guest',
  Member = 'member',
  Admin = 'admin'
}
/**
 * Статус членства в СРО.
 * Отображается в профиле пользователя.
 * Цвета статусов определены в src/utils/constants.ts
 */
export enum MembershipStatus {
  /** Действующее членство */
  Active = 'active',
  /** Членство скоро истекает */
  Expiring = 'expiring',
  /** Членство истекло или пользователь исключен */
  Expired = 'expired',
}

/**
 * Базовый интерфейс пользователя.
 */
export interface User {
  id: string;
  inn: string;
  full_name: string | null;
  role: UserRole;
  membership_status: string | null;
  membership_exp: string | null;
  created_at: string | null;
  recovery_email?: string | null;
  updated_at?: string;
}

/**
 * Интерфейс, представляющий профиль пользователя.
 * Соответствует структуре таблицы `users` в Supabase.
 */
export interface UserProfile extends User {
  /** Email для восстановления (обязательное поле) */
  recovery_email: string | null;
  /** Дата последнего обновления записи (обязательное поле) */
  updated_at: string;
}
/**
 * Тип для данных, возвращаемых после успешной аутентификации.
 * Включает профиль пользователя и информацию о сессии.
 */
export interface AuthData {
  /** Профиль аутентифицированного пользователя */
  user: UserProfile;
  /** Токен доступа (если используется JWT, например, от Supabase) */
  accessToken: string | null;
  /** Токен обновления (если используется) */
  refreshToken: string | null;
}

/**
 * Тип для данных, необходимых для входа по ИНН.
 */
export interface LoginCredentials {
  /** ИНН пользователя (10 или 12 цифр) */
  inn: string;
}
/**
 * Тип для ответа от Edge Function `/verify-inn`.
 * Представляет данные из официального реестра СРО.
 */
export interface RegistryVerificationResponse {
  /** ИНН */
  inn: string;
  /** Полное имя или название организации */
  fullName: string;
  /** Статус в реестре СРО */
  status: string; // Предполагается, что это строка из реестра, например, "Действующий"
  /** Дата окончания членства в формате YYYY-MM-DD или ISO */
  membershipExpirationDate: string | null;
  /** Флаг успешности проверки */
  success: boolean;
  /** Сообщение об ошибке, если проверка не удалась */
  message?: string;
}

/**
 * Тип для представления вычисленного статуса членства с дополнительной информацией.
 * Используется для отображения в UI.
 */
export interface MembershipInfo {
  /** Вычисленный статус */
  status: MembershipStatus;
  /** Количество дней до окончания (если применимо) */
  daysUntilExpiry: number | null;
  /** Человекочитаемое сообщение о статусе */
  message: string;
  /** Цвет, ассоциированный со статусом (из констант) */
  color: string;
}

