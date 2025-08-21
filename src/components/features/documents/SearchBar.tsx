// src/components/features/documents/SearchBar.tsx

import React, { useState, useEffect, useCallback } from 'react';
// import Input from '../../ui/Input'; // Можно использовать, если нужно
// import Button from '../../ui/Button'; // Можно использовать, если нужно

// Определяем типы пропсов
interface SearchBarProps {
  initialValue?: string; // Начальное значение поиска
  onSearch: (query: string) => void; // Callback при изменении поискового запроса (с debounce)
  placeholder?: string; // Плейсхолдер для поля ввода
  debounceMs?: number; // Задержка в миллисекундах для debounce (по умолчанию 300)
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  onSearch,
  placeholder = 'Поиск по названию...',
  debounceMs = 300,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);

  // Функция с debounce для вызова onSearch
  // useCallback необходим, чтобы функция не пересоздавалась при каждом рендере
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  // Обработчик изменения ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Вызываем debounced функцию при каждом изменении
    debouncedSearch(value);
  };

  // Эффект для синхронизации initialValue с внутренним состоянием
  // (на случай, если initialValue может измениться извне)
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  return (
    <div className="w-full">
      <label htmlFor="document-search" className="sr-only">
        {placeholder}
      </label>
      <input
        type="text"
        id="document-search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
      />
    </div>
  );
};

// Вспомогательная функция для создания debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout!);
      func(...args);
    };
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
  };
}

export default SearchBar;
