// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { getItemFromStorage, setItemToStorage } from '../utils/storageUtils';

/**
 * Пользовательский хук для управления состоянием, синхронизированным с localStorage.
 *
 * Обеспечивает безопасную работу с localStorage, включая обработку ошибок
 * и автоматическую синхронизацию между вкладками (через storage event).
 *
 * @template T - Тип значения, хранящегося в localStorage.
 * @param key - Ключ в localStorage.
 * @param initialValue - Начальное значение, если ключ не найден или localStorage недоступен.
 * @returns Кортеж [значение, функция_установки_значения].
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Получаем начальное значение из localStorage или используем переданное initialValue
  const readValue = useCallback((): T => {
    // Предотвращаем выполнение на сервере (SSR)
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = getItemFromStorage<T>(key, initialValue);
      return item;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Функция для установки значения в состояние и localStorage
  const setValue: (value: T | ((val: T) => T)) => void = (value) => {
    // Предотвращаем выполнение на сервере (SSR)
    if (typeof window === 'undefined') {
      console.warn(`Tried setting localStorage key "${key}" even though environment is not a client`);
      return;
    }

    try {
      // Разрешаем передачу функции для обновления состояния (как в useState)
      const newValue = value instanceof Function ? value(storedValue) : value;

      // Сохраняем в localStorage
      setItemToStorage(key, newValue);

      // Обновляем состояние
      setStoredValue(newValue);

      // Уведомляем других слушателей (например, других вкладок) об изменении
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        oldValue: JSON.stringify(storedValue),
        newValue: JSON.stringify(newValue),
      }));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Инициализируем состояние при монтировании компонента
  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Зависимость только от ключа, так как readValue уже зависит от initialValue

  // Слушаем события storage для синхронизации между вкладками
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== e.oldValue) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    // Добавляем слушатель
    window.addEventListener('storage', handleStorageChange);

    // Убираем слушатель при размонтировании
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
