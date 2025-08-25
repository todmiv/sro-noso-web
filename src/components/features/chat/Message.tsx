// src/components/features/chat/Message.tsx

import React from 'react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

const Message: React.FC<MessageProps> = ({ role, content }) => {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-2 ${
          role === 'user'
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
        }`}
      >
        <p>{content}</p>
      </div>
    </div>
  );
};

export default Message;
