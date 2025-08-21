// src/components/layout/Footer.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              &copy; {currentYear} СРО НОСО. Все права защищены.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-primary hover:underline">
              Политика конфиденциальности
            </Link>
            <Link to="/help" className="text-sm text-gray-600 hover:text-primary hover:underline">
              Помощь
            </Link>
            {/* <a href="mailto:support@sro-noso.ru" className="text-sm text-gray-600 hover:text-primary hover:underline">
              Контакты
            </a> */}
            {/* Ссылка на внешний ресурс СРО, если потребуется */}
            {/* <a href="https://www.noso.ru" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-primary hover:underline">
              Официальный сайт СРО
            </a> */}
          </div>
        </div>
        
        {/* Дополнительная информация, например, версия MVP или статус разработки (опционально) */}
        {/* <div className="mt-4 text-center text-xs text-gray-500">
          MVP v1.0
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
