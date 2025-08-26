// src/components/features/chat/Message.tsx

import React from 'react';
import { ChatRole } from '../../../types/chat';

interface MessageProps {
  content: string;
  role: ChatRole;
  timestamp?: string;
}

const Message: React.FC<MessageProps> = ({ content, role, timestamp }) => {
  const isUser = role === ChatRole.USER;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
        }`}
      >
        <p>{content}</p>
        {timestamp && (
          <div className="text-xs opacity-75 mt-1">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;

