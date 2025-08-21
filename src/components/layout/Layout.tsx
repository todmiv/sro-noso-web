// src/components/layout/Layout.tsx

import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer'; // Импорт нового компонента Footer

interface LayoutProps {
  children: ReactNode; // Содержимое, которое будет отображаться внутри макета (основная часть страницы)
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Шапка сайта */}
      <Header />
      
      {/* Основное содержимое (рендерится из children) */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* Подвал сайта */}
      <Footer />
    </div>
  );
};

export default Layout;
