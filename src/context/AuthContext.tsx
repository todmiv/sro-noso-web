// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthData, UserProfile, UserRole, MembershipStatus } from '../types/user';
import { isMembershipExpired, isMembershipExpiringSoon } from '../utils/helpers';
import * as Sentry from "@sentry/react";
import { isValidINN } from '../utils/validation';
// Валидация работает корректно

interface VerifyINNResponse {
  success: boolean;
  message?: string;
  fullName?: string;
  membershipExpirationDate?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  role: UserRole; // Теперь тип UserRole - это union из строковых литералов
  membershipStatus: MembershipStatus | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthData }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

export interface AuthContextType extends AuthState {
  login: (inn: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: UserProfile) => void;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  role: 'guest',
  membershipStatus: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function computeMembershipStatus(user: UserProfile | null): MembershipStatus | null {
  if (!user || !user.membership_exp) return null;
  if (isMembershipExpired(user.membership_exp)) return MembershipStatus.Expired;
  if (isMembershipExpiringSoon(user.membership_exp, 30)) return MembershipStatus.Expiring;
  return MembershipStatus.Active;
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START': return {...state, loading: true, error: null};
    case 'LOGIN_SUCCESS': return {
      ...state,
      user: action.payload.user,
      role: action.payload.user.role as UserRole,
      membershipStatus: computeMembershipStatus(action.payload.user),
      loading: false,
      error: null
    };
    case 'LOGIN_FAILURE': return {...state, user: null, role: 'guest', membershipStatus: null, 
      loading: false, error: action.payload};
    case 'LOGOUT': return {...state, user: null, role: 'guest', membershipStatus: null, 
      loading: false, error: null};
    case 'SET_USER': return {...state, user: action.payload, role: action.payload.role, 
      membershipStatus: computeMembershipStatus(action.payload)};
    case 'SET_ERROR': return {...state, error: action.payload, loading: false};
    case 'CLEAR_ERROR': return {...state, error: null};
    case 'SET_LOADING': return {...state, loading: action.payload};
    default: return state;
  }
}

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  useEffect(() => {
    const initializeAuthState = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data.session?.user) {
        const { data: userData, error: fetchUserError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
        
        if (fetchUserError) throw fetchUserError;
        
        if (userData) {
          // Create a complete UserProfile object with default values for new fields
          // Create a UserProfile object with safe property access
          // Handle potential missing properties in userData
          const userProfile: UserProfile = {
            id: userData.id,
            inn: userData.inn,
            full_name: userData.full_name,
            role: userData.role as UserRole,
            membership_exp: userData.membership_exp,
            recovery_email: ('recovery_email' in userData) ? (userData.recovery_email as string | null) : null,
            created_at: ('created_at' in userData) ? (userData.created_at as string) : new Date().toISOString(),
            updated_at: ('updated_at' in userData) ? (userData.updated_at as string) : new Date().toISOString(),
          };
          
          // For backward compatibility with old user records
          if (!userProfile.recovery_email) userProfile.recovery_email = null;
          if (!userProfile.created_at) userProfile.created_at = new Date().toISOString();
          if (!userProfile.updated_at) userProfile.updated_at = new Date().toISOString();
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: { 
            user: userProfile, 
            accessToken: data.session.access_token, 
            refreshToken: data.session.refresh_token 
          }});
        } else {
          await supabase.auth.signOut();
        }
        } 
      } catch (err: any) {
        console.error('Auth init error:', err);
        Sentry.captureException(err);
        if (err instanceof Error) {
          dispatch({ type: 'SET_ERROR', payload: err.message || 'Ошибка инициализации' });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initializeAuthState();
  }, []);

  const login = async (inn: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      if (!isValidINN(inn)) throw new Error('Некорректный ИНН');

      const { data, error: verificationError } = await supabase.functions
        .invoke<VerifyINNResponse>('verify-inn', { body: { inn } });
      if (verificationError || !data?.success) 
        throw new Error(data?.message || verificationError?.message || 'Ошибка проверки');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          inn,
          full_name: data?.fullName || null,
          role: 'member' as UserRole,
          membership_exp: data?.membershipExpirationDate || null,
          recovery_email: null, // Add missing field
          created_at: new Date().toISOString(), // Add missing field
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create a complete UserProfile object with default values
      // Create a UserProfile object with safe property access
      // Handle potential missing properties in userData
      const userProfile: UserProfile = {
        id: userData.id,
        inn: userData.inn,
        full_name: userData.full_name,
        role: userData.role as UserRole,
        membership_exp: userData.membership_exp,
        recovery_email: ('recovery_email' in userData) ? (userData.recovery_email as string | null) : null,
        created_at: ('created_at' in userData) ? (userData.created_at as string) : new Date().toISOString(),
        updated_at: ('updated_at' in userData) ? (userData.updated_at as string) : new Date().toISOString(),
      };
      
      // For backward compatibility with old user records
      if (!userProfile.recovery_email) userProfile.recovery_email = null;
      if (!userProfile.created_at) userProfile.created_at = new Date().toISOString();
      if (!userProfile.updated_at) userProfile.updated_at = new Date().toISOString();
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userProfile, accessToken: null, refreshToken: null } });
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      Sentry.captureException(err);
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
      return false;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout: async () => {
      try {
        await supabase.auth.signOut();
        dispatch({ type: 'LOGOUT' });
      } catch (err: any) {
        console.error('Logout error:', err);
        Sentry.captureException(err);
      }
    },
    updateUser: (userData) => dispatch({ type: 'SET_USER', payload: userData }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
