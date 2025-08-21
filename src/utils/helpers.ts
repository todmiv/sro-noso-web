// src/utils/helpers.ts
import { REGEX } from './constants';

/**
 * Вспомогательные функции проекта.
 *
 * Включает валидацию, форматирование и другие утилиты.
 */

/**
 * Проверяет, является ли строка допустимым ИНН.
 * ИНН может быть длиной 10 (для юридических лиц) или 12 (для физических лиц) цифр.
 *
 * @param inn - Строка, представляющая ИНН.
 * @returns true, если ИНН валиден, иначе false.
 */
export function isValidINN(inn: string): boolean {
    if (!inn) return false;
    // Используем регулярное выражение из constants.ts
    return REGEX.INN.test(inn);
}

/**
 * Проверяет, является ли строка допустимым email.
 *
 * @param email - Строка, представляющая email.
 * @returns true, если email валиден, иначе false.
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;
    // Используем регулярное выражение из constants.ts
    return REGEX.EMAIL.test(email);
}

/**
 * Форматирует дату в строку вида "DD.MM.YYYY".
 *
 * @param date - Объект Date или строка, представляющая дату.
 * @returns Отформатированная строка даты или пустая строка, если дата некорректна.
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Проверка на валидность даты

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Форматирует дату и время в строку вида "DD.MM.YYYY HH:mm".
 *
 * @param date - Объект Date или строка, представляющая дату и время.
 * @returns Отформатированная строка даты и времени или пустая строка, если дата некорректна.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const dateString = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateString} ${hours}:${minutes}`;
}

/**
 * Вычисляет количество дней между двумя датами.
 * Результат округляется до ближайшего целого числа.
 *
 * @param startDate - Начальная дата.
 * @param endDate - Конечная дата.
 * @returns Количество дней (может быть отрицательным).
 */
export function getDaysDifference(startDate: Date, endDate: Date): number {
    const oneDayInMs = 1000 * 60 * 60 * 24;
    const diffInMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffInMs / oneDayInMs);
}

/**
 * Преобразует размер файла в байтах в человекочитаемый формат (KB, MB, GB).
 *
 * @param bytes - Размер файла в байтах.
 * @param decimals - Количество знаков после запятой (по умолчанию 2).
 * @returns Строка с отформатированным размером файла.
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Преобразует MIME-тип файла в читаемое описание типа.
 *
 * @param mimeType - MIME-тип файла (например, 'application/pdf').
 * @returns Человекочитаемое описание типа файла.
 */
export function getFileTypeDescription(mimeType: string): string {
    const mimeToDescription: Record<string, string> = {
        'application/pdf': 'PDF Документ',
        'application/msword': 'Документ Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Документ Word',
        'text/plain': 'Текстовый файл',
        'image/jpeg': 'Изображение JPEG',
        'image/png': 'Изображение PNG',
        'image/gif': 'Изображение GIF',
        'image/svg+xml': 'Изображение SVG',
        // Можно добавить другие MIME-типы по необходимости
    };

    return mimeToDescription[mimeType] || mimeType; // Возвращаем сам MIME-тип, если описание не найдено
}

/**
 * Усекает длинный текст до заданной длины и добавляет суффикс.
 *
 * @param text - Исходный текст.
 * @param maxLength - Максимальная длина текста.
 * @param suffix - Суффикс, добавляемый в конце (по умолчанию '...').
 * @returns Усеченный текст.
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Генерирует уникальный идентификатор (например, для гостя).
 * Не криптографически безопасный, но достаточный для клиентских задач.
 *
 * @returns Строка с уникальным идентификатором.
 */
export function generateGuestId(): string {
    return 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Проверяет, истёк ли срок действия членства.
 *
 * @param expirationDate - Дата окончания членства.
 * @returns true, если срок истёк, иначе false.
 */
export function isMembershipExpired(expirationDate: string | Date | null | undefined): boolean {
    if (!expirationDate) return true; // Если дата не указана, считаем истёкшим
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Сравниваем только даты, без времени
    return expDate < today;
}

/**
 * Проверяет, истекает ли срок действия членства в ближайшие N дней.
 *
 * @param expirationDate - Дата окончания членства.
 * @param daysThreshold - Порог в днях для определения "скоро истекающего" статуса.
 * @returns true, если срок истекает в течение указанного количества дней, иначе false.
 */
export function isMembershipExpiringSoon(expirationDate: string | Date | null | undefined, daysThreshold: number = 30): boolean {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expDate < today) return false; // Уже истёк

    const diffInDays = getDaysDifference(today, expDate);
    return diffInDays <= daysThreshold && diffInDays >= 0;
}


// Экспорт всех функций как named exports для удобного импорта
// export {
//     isValidINN,
//     isValidEmail,
//     formatDate,
//     formatDateTime,
//     getDaysDifference,
//     formatFileSize,
//     getFileTypeDescription,
//     truncateText,
//     generateGuestId,
//     isMembershipExpired,
//     isMembershipExpiringSoon,
// };
