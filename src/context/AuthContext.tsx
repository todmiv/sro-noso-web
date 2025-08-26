import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserRole, UserProfile } from '../types/user';
import * as Sentry from '@sentry/react';

// Определение типов
export interface AuthData {
  user: UserProfile;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  role: UserRole;
}

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthData }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  role: UserRole;
  login: (inn: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  role: UserRole.Guest
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        role: action.payload.user.role as UserRole || UserRole.Guest,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false
      };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        role: (action.payload.role as UserRole) || UserRole.Guest,
        isAuthenticated: true
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: userData, error: fetchUserError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (fetchUserError) {
            console.error('Error fetching user data:', fetchUserError);
            Sentry.captureException(fetchUserError);
            dispatch({ type: 'LOGOUT' });
            return;
          }

          if (userData) {
            const userProfile: UserProfile = {
              id: userData.id,
              inn: userData.inn,
              full_name: userData.full_name,
              role: (userData.role as UserRole) || UserRole.Guest,
              membership_exp: userData.membership_exp,
              membership_status: userData.membership_status,
              recovery_email: '', // Значение по умолчанию
              created_at: userData.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString() // Значение по умолчанию
            };

            const authData: AuthData = {
              user: userProfile,
              accessToken: session.access_token || null,
              refreshToken: session.refresh_token || null,
            };
            dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (err: any) {
        console.error('Unexpected error during auth init:', err);
        Sentry.captureException(err);
        dispatch({ type: 'SET_ERROR', payload: 'Произошла непредвиденная ошибка при инициализации.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuthState();

    const authListener = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (inn: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Логика логина
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      Sentry.captureException(err);
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (err: any) {
      console.error('Logout error:', err);
      Sentry.captureException(err);
    }
  };

  // Добавляем метод clearError
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

