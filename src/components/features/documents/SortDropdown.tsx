// src/components/features/documents/SortDropdown.tsx

import React from 'react';
// import { ChevronDownIcon } from '@heroicons/react/20/solid'; // Если используем иконки

// Определяем типы пропсов
interface SortDropdownProps {
  value: 'newest' | 'oldest' | 'title'; // Текущее значение сортировки с добавлением 'title'
  onChange: (value: 'newest' | 'oldest' | 'title') => void; // Обновленный callback с поддержкой 'title'
  label?: string;
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  label = 'Сортировать по:',
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as 'newest' | 'oldest' | 'title');
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
          <option value="title">По названию</option>
        </select>
      </div>
    </div>
  );
};

export default SortDropdown;
