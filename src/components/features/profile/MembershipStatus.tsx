// src/components/features/profile/MembershipStatus.tsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { formatDate, isMembershipExpired, isMembershipExpiringSoon } from '../../../utils/helpers';
import { COLORS } from '../../../utils/constants';
import { MembershipStatus } from '../../../types/user';

/**
 * Компонент для отображения статуса членства пользователя.
 *
 * Реализует сценарии 2.2 (Просмотр профиля) и 2.5 (Управление членством) из ТЗ.
 * Показывает цветной бейдж статуса, дату окончания и инструкции при необходимости.
 */

// Вспомогательная функция для получения стилей и сообщения для бейджа
const getMembershipBadgeInfo = (userMembershipStatus: MembershipStatus | null, membershipExp: string | null) => {
  if (!userMembershipStatus || !membershipExp) {
    return {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      text: 'Статус не определен',
    };
  }

  switch (userMembershipStatus) {
    case MembershipStatus.Active:
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        text: '🟢 Действует',
      };
    case MembershipStatus.Expiring:
      const daysUntilExpiry = membershipExp ? Math.ceil((new Date(membershipExp).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        text: `🟡 Истекает через ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'день' : (daysUntilExpiry && daysUntilExpiry < 5) ? 'дня' : 'дней'}`,
      };
    case MembershipStatus.Expired:
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        text: '🔴 Истёк',
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        text: 'Статус не определен',
      };
  }
};

const MembershipStatusComponent: React.FC = () => {
  const { user } = useAuth();

  // Проверка на наличие пользователя и его роль
  if (!user || user.role !== 'member') {
    return null; // Или можно отобразить сообщение, что пользователь не является членом СРО
  }

  // Вычисляем статус на основе даты окончания
  let computedStatus: MembershipStatus | null = null;
  if (user.membership_exp) {
    if (isMembershipExpired(user.membership_exp)) {
      computedStatus = MembershipStatus.Expired;
    } else if (isMembershipExpiringSoon(user.membership_exp, 30)) {
      computedStatus = MembershipStatus.Expiring;
    } else {
      computedStatus = MembershipStatus.Active;
    }
  }

  const badgeInfo = getMembershipBadgeInfo(computedStatus, user.membership_exp);
  const daysUntilExpiry = user.membership_exp ?
    Math.ceil((new Date(user.membership_exp).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
    null;

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6" id="membership">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Управление членством</h3>
      
      <div className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">ИНН</dt>
          <dd className="mt-1 text-sm text-gray-900">{user.inn}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">Название организации</dt>
          <dd className="mt-1 text-sm text-gray-900">{user.full_name || 'Не указано'}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">Статус членства</dt>
          <dd className="mt-1">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeInfo.bgColor} ${badgeInfo.textColor}`}>
              {badgeInfo.text}
            </span>
          </dd>
        </div>
        
        {user.membership_exp && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Дата окончания</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(user.membership_exp)}</dd>
          </div>
        )}
        
        {computedStatus === MembershipStatus.Expiring && daysUntilExpiry !== null && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Дней до окончания</dt>
            <dd className="mt-1 text-sm text-gray-900">{daysUntilExpiry}</dd>
          </div>
        )}
        
        {(computedStatus === MembershipStatus.Expired) && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Членство приостановлено. Обратитесь в СРО для восстановления.
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipStatusComponent;
