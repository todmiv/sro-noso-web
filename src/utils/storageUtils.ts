// src/utils/storageUtils.ts
import { STORAGE_KEYS } from './constants';
import { generateGuestId } from './helpers';

/**
 * Вспомогательные функции для работы с localStorage.
 *
 * Обрабатывают ошибки (например, приватный режим Safari) и предоставляют
 * типизированный доступ к данным приложения.
 */

// Флаг для отслеживания доступности localStorage
let isLocalStorageAvailable: boolean | null = null;

/**
 * Проверяет, доступен ли localStorage.
 * Выполняет однократную проверку и кэширует результат.
 *
 * @returns true, если localStorage доступен, иначе false.
 */
export function checkLocalStorageAvailability(): boolean {
  if (isLocalStorageAvailable !== null) {
    return isLocalStorageAvailable;
  }

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
  } catch (e) {
    console.warn('localStorage is not available. Some features may be limited.', e);
    isLocalStorageAvailable = false;
  }

  return isLocalStorageAvailable;
}

/**
 * Безопасно получает значение из localStorage.
 *
 * @param key - Ключ для получения значения.
 * @param defaultValue - Значение по умолчанию, если ключ не найден или localStorage недоступен.
 * @returns Значение из localStorage или значение по умолчанию.
 */
export function getItemFromStorage<T>(key: string, defaultValue: T): T {
  if (!checkLocalStorageAvailability()) {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Безопасно устанавливает значение в localStorage.
 *
 * @param key - Ключ для сохранения значения.
 * @param value - Значение для сохранения (будет преобразовано в JSON строку).
 */
export function setItemToStorage<T>(key: string, value: T): void {
  if (!checkLocalStorageAvailability()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

/**
 * Безопасно удаляет значение из localStorage.
 *
 * @param key - Ключ для удаления.
 */
export function removeItemFromStorage(key: string): void {
  if (!checkLocalStorageAvailability()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Получает или генерирует уникальный идентификатор гостя.
 * Используется для отслеживания лимитов ИИ-запросов и истории чата для гостей.
 *
 * @returns Уникальный идентификатор гостя.
 */
export function getOrCreateGuestId(): string {
  let guestId = getItemFromStorage<string>(STORAGE_KEYS.GUEST_ID, '');
  if (!guestId) {
      guestId = generateGuestId();
      setItemToStorage(STORAGE_KEYS.GUEST_ID, guestId);
  }
  return guestId;
}

/**
 * Проверяет, был ли показан баннер о согласии на использование localStorage.
 *
 * @returns true, если баннер уже был показан, иначе false.
 */
export function isConsentBannerShown(): boolean {
  return getItemFromStorage<boolean>(STORAGE_KEYS.CONSENT_BANNER_SHOWN, false);
}

/**
 * Отмечает, что баннер о согласии на использование localStorage был показан.
 */
export function setConsentBannerShown(): void {
  setItemToStorage(STORAGE_KEYS.CONSENT_BANNER_SHOWN, true);
}

// Экспорт всех функций как named exports для удобного импорта
// export {
//   checkLocalStorageAvailability,
//   getItemFromStorage,
//   setItemToStorage,
//   removeItemFromStorage,
//   getOrCreateGuestId,
//   isConsentBannerShown,
//   setConsentBannerShown,
// };
