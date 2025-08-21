// src/hooks/useAuth.ts
import { useContext } from 'react';
import AuthContext, { AuthContextType } from '../context/AuthContext';

/**
 * Пользовательский хук для использования контекста аутентификации.
 *
 * Предоставляет доступ к состоянию аутентификации (пользователь, загрузка, ошибка)
 * и методам управления (вход, выход, обновление данных).
 *
 * @returns Значение контекста аутентификации.
 * @throws {Error} Если хук используется вне компонента AuthProvider.
 *
 * @example
 * const { user, login, logout, loading, error } = useAuth();
 *
 * if (loading) return <div>Загрузка...</div>;
 * if (error) return <div>Ошибка: {error}</div>;
 * if (user) return <div>Привет, {user.full_name}!</div>;
 */
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
