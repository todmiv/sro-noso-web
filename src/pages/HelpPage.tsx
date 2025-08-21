// src/pages/HelpPage.tsx

import React, { useState } from 'react';
import SupportForm from '../components/features/help/SupportForm'; // Импорт нового компонента

const HelpPage: React.FC = () => {
  // === Состояния аккордеона FAQ ===
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // === Обработчики для FAQ (аккордеон) ===
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // === Обработчик успешной отправки формы ===
  const handleFormSubmitSuccess = () => {
    // Можно добавить дополнительную логику, если нужно
    console.log("Форма успешно отправлена, HelpPage получил уведомление.");
  };

  // === Данные для FAQ (заглушки) ===
  const faqs = [
    {
      question: "Как восстановить пароль?",
      answer: "На экране входа нажмите «Забыли пароль». Введите свой ИНН, и система отправит инструкции на email, указанный в профиле."
    },
    {
      question: "Как продлить членство?",
      answer: "Членство оплачивается ежеквартально. Реквизиты и счёт приходят на email, указанный при регистрации, за 10 дней до окончания срока."
    },
    {
      question: "Ограничения для гостей?",
      answer: "Гости могут просматривать и скачивать открытые документы, а также задавать до 3 вопросов ИИ-консультанту в день."
    },
    {
      question: "Формат документов?",
      answer: "Платформа поддерживает документы в форматах PDF и DOCX. Их можно скачивать или просматривать онлайн."
    },
    {
      question: "Как сообщить об ошибке бота?",
      answer: "Используйте форму обратной связи на этой странице или напишите на support@sro-noso.ru. Укажите, пожалуйста, шаги для воспроизведения ошибки."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Помощь и обратная связь</h1>

      {/* Раздел FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Часто задаваемые вопросы</h2>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
              <button
                className="flex justify-between items-center w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => toggleFaq(index)}
                aria-expanded={openFaqIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqIndex === index && (
                <div id={`faq-answer-${index}`} className="p-4 bg-white">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Раздел контактов */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Контакты</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="mb-2"><span className="font-medium">Email поддержки:</span> <a href="mailto:support@sro-noso.ru" className="text-primary hover:underline">support@sro-noso.ru</a></p>
          <p className="mb-2"><span className="font-medium">Телефон:</span> +7 (495) 123-45-67</p>
          <p><span className="font-medium">Часы работы:</span> Понедельник – Пятница, 09:00 – 18:00 (МСК)</p>
        </div>
      </section>

      {/* Раздел формы обратной связи */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Сообщить об ошибке</h2>
        
        {/* Используем вынесенный компонент SupportForm */}
        <SupportForm onSubmitSuccess={handleFormSubmitSuccess} />
      </section>
    </div>
  );
};

export default HelpPage;
