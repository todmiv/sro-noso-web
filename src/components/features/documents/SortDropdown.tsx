// src/components/features/documents/SortDropdown.tsx

import React from 'react';
// import { ChevronDownIcon } from '@heroicons/react/20/solid'; // Если используем иконки

// Определяем типы пропсов
interface SortDropdownProps {
  value: 'newest' | 'oldest'; // Текущее значение сортировки
  onChange: (value: 'newest' | 'oldest') => void; // Callback при изменении значения
  label?: string; // Опциональная метка
  className?: string; // Дополнительные классы для стилизации
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  label = 'Сортировать по:',
  className = '',
}) => {
  // Обработчик изменения значения
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as 'newest' | 'oldest');
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <label htmlFor="sort-order" className="mr-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id="sort-order"
          value={value}
          onChange={handleChange}
          className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-primary focus:border-primary"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
        {/* Иконка раскрывающегося списка (опционально) */}
        {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <ChevronDownIcon className="h-4 w-4" />
        </div> */}
      </div>
    </div>
  );
};

export default SortDropdown;
