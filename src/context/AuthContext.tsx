// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient'; // Импортируем клиента Supabase
import { AuthData, UserProfile, UserRole } from '../types/user';
import { isMembershipExpired, isMembershipExpiringSoon } from '../utils/helpers';
import { MembershipStatus } from '../types/user';
import { COLORS } from '../utils/constants';

/**
 * Контекст аутентификации.
 *
 * Управляет состоянием аутентифицированного пользователя,
 * статусом загрузки, ошибками и предоставляет методы для входа/выхода.
 */

// --- Типы для состояния и действий контекста ---

/** Состояние контекста аутентификации */
interface AuthState {
  /** Данные аутентифицированного пользователя */
  user: UserProfile | null;
  /** Флаг, указывающий, загружается ли состояние аутентификации (при инициализации) */
  loading: boolean;
  /** Сообщение об ошибке, если произошла ошибка аутентификации */
  error: string | null;
  /** Роль текущего пользователя (гость или член) */
  role: UserRole;
  /** Вычисленный статус членства */
  membershipStatus: MembershipStatus | null;
}

/** Возможные действия для редьюсера */
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthData }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// --- Начальное состояние ---

/** Начальное состояние контекста */
const initialState: AuthState = {
  user: null,
  loading: true, // Изначально true, так как состояние загружается при старте
  error: null,
  role: UserRole.Guest, // По умолчанию гость
  membershipStatus: null,
};

// --- Контекст ---

/** Интерфейс для значения контекста */
interface AuthContextType extends AuthState {
  /** Функция для входа по ИНН */
  login: (inn: string) => Promise<boolean>;
  /** Функция для выхода */
  logout: () => Promise<void>;
  /** Функция для обновления данных пользователя */
  updateUser: (userData: UserProfile) => void;
  /** Функция для очистки ошибок */
  clearError: () => void;
}

// Создаем контекст с начальным значением undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Редьюсер ---

/** Редьюсер для управления состоянием аутентификации */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.user.role,
        membershipStatus: computeMembershipStatus(action.payload.user),
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        role: UserRole.Guest,
        membershipStatus: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        role: UserRole.Guest,
        membershipStatus: null,
        loading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        role: action.payload.role,
        membershipStatus: computeMembershipStatus(action.payload),
        loading: false, // Предполагаем, что если пользователь установлен, загрузка завершена
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// --- Вспомогательная функция для вычисления статуса членства ---

/**
 * Вычисляет статус членства на основе данных пользователя.
 * @param user - Данные пользователя.
 * @returns Вычисленный статус членства.
 */
function computeMembershipStatus(user: UserProfile | null): MembershipStatus | null {
  if (!user || user.role !== UserRole.Member) {
    return null;
  }

  if (!user.membership_exp) {
    // Если дата окончания не указана, считаем истёкшим
    return MembershipStatus.Expired;
  }

  if (isMembershipExpired(user.membership_exp)) {
    return MembershipStatus.Expired;
  }

  if (isMembershipExpiringSoon(user.membership_exp, 30)) { // 30 дней как порог
    return MembershipStatus.Expiring;
  }

  return MembershipStatus.Active;
}

// --- Провайдер контекста ---

/** Свойства провайдера контекста */
interface AuthProviderProps {
  /** Дочерние компоненты, которые будут иметь доступ к контексту */
  children: ReactNode;
}

/**
 * Провайдер контекста аутентификации.
 *
 * Оборачивает приложение и предоставляет состояние аутентификации
 * и методы для его управления всем дочерним компонентам.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Эффект для инициализации состояния аутентификации при монтировании
  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        // Получаем текущую сессию пользователя из Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session on init:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Ошибка при инициализации сессии.' });
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Ошибка при инициализации сессии.' });
            return;
        }

        if (session?.user) {
          // Если сессия существует, получаем данные пользователя из вашей таблицы `users`
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError || !userData) {
            console.error('Error fetching user data on init:', userError);
            dispatch({ type: 'SET_ERROR', payload: 'Ошибка при загрузке данных пользователя.' });
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Ошибка при загрузке данных пользователя.' });
            return;
          }

          const authData: AuthData = {
            user: userData,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          };

          dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
        } else {
          // Нет активной сессии, пользователь - гость
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Нет активной сессии.' });
        }
      } catch (err) {
        console.error('Unexpected error during auth init:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Произошла непредвиденная ошибка при инициализации.' });
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Произошла непредвиденная ошибка при инициализации.' });
      } finally {
        // В любом случае, после попытки инициализации, убираем состояние загрузки
        // dispatch({ type: 'SET_LOADING', payload: false }); // Не нужен отдельный экшен
      }
    };

    initializeAuthState();
  }, []); // Пустой массив зависимостей - запускается только один раз при монтировании

  /**
   * Функция для входа по ИНН.
   * Взаимодействует с authService (который будет создан позже).
   * @param inn - ИНН пользователя.
   * @returns true, если вход успешен, иначе false.
   */
  const login = async (inn: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // TODO: Здесь будет вызов authService.verifyINNAndLogin(inn)
      // Пока имитируем успешный вход для тестирования
      // В реальности authService.verifyINNAndLogin должен возвращать Promise<AuthData | null>
      
      // Имитация асинхронного вызова
      // const authData = await authService.verifyINNAndLogin(inn);
      
      // if (authData) {
      //   dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
      //   return true;
      // } else {
      //   dispatch({ type: 'LOGIN_FAILURE', payload: 'Не удалось войти. Проверьте ИНН.' });
      //   return false;
      // }
      
      // --- ВРЕМЕННАЯ ИМИТАЦИЯ ---
      console.warn('Login function is a stub. authService.verifyINNAndLogin needs to be implemented.');
      // Для демонстрации, предположим, что вход успешен
      const mockUser: UserProfile = {
        id: 'mock-user-id-' + Date.now(),
        inn: inn,
        full_name: `Организация с ИНН ${inn}`,
        role: UserRole.Member,
        membership_exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const mockAuthData: AuthData = {
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockAuthData });
      return true;
      // --- КОНЕЦ ИМИТАЦИИ ---
      
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Произошла ошибка при попытке входа.';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return false;
    }
  };

  /**
   * Функция для выхода.
   */
  const logout = async (): Promise<void> => {
    try {
      // Вызываем метод выхода из Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Ошибка при выходе из системы.' });
        // Даже если Supabase вернул ошибку, мы всё равно обновляем локальное состояние
      }

      // Обновляем локальное состояние
      dispatch({ type: 'LOGOUT' });
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Произошла непредвиденная ошибка при выходе.' });
      // Даже если произошла ошибка, мы всё равно обновляем локальное состояние
      dispatch({ type: 'LOGOUT' });
    }
  };

  /**
   * Функция для обновления данных пользователя в состоянии.
   * Может быть вызвана, например, после фоновой проверки статуса.
   * @param userData - Обновленные данные пользователя.
   */
  const updateUser = (userData: UserProfile) => {
    dispatch({ type: 'SET_USER', payload: userData });
  };

  /**
   * Функция для очистки ошибок.
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Формируем значение контекста
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Пользовательский хук ---

/**
 * Пользовательский хук для использования контекста аутентификации.
 *
 * Должен использоваться внутри компонентов, обернутых в AuthProvider.
 *
 * @returns Значение контекста аутентификации.
 * @throws {Error} Если хук используется вне AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Экспорт контекста и провайдера как named exports
export default AuthContext;
