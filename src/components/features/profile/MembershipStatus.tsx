import React from 'react';
                                                   import { useAuth } from '../../../context/AuthContext';

// Определяем enum внутри компонента вместо импорта
enum Status {
  Active = 'active',
  Expiring = 'expiring',
  Expired = 'expired'
}

interface MembershipStatusProps {
  // props if needed
}

const MembershipStatus: React.FC<MembershipStatusProps> = () => {
  const { user } = useAuth();

  // Вычисляем статус членства
  const calculateMembershipStatus = (): { status: Status; daysUntilExpiry: number | null } => {
    if (!user?.membership_exp) {
      return { status: Status.Expired, daysUntilExpiry: null };
    }

    const today = new Date();
    const expiryDate = new Date(user.membership_exp);
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysUntilExpiry <= 0) {
      return { status: Status.Expired, daysUntilExpiry: null };
    } else if (daysUntilExpiry <= 30) {
      return { status: Status.Expiring, daysUntilExpiry };
    } else {
      return { status: Status.Active, daysUntilExpiry };
    }
  };

  const { status: computedStatus, daysUntilExpiry } = calculateMembershipStatus();

  // Определяем стили и текст в зависимости от статуса
  const getStatusInfo = (status: Status) => {
    switch (status) {
      case Status.Active:
        return {
          className: "status-active",
          title: "Активно",
          icon: "✓",
          color: "#4CAF50"
        };
      case Status.Expiring:
        return {
          className: "status-expiring",
          title: "Скоро истекает",
          icon: "⚠",
          color: "#FF9800"
        };
      case Status.Expired:
      default:
        return {
          className: "status-expired",
          title: "Истекло",
          icon: "✗",
          color: "#F44336"
        };
    }
  };

  const statusInfo = getStatusInfo(computedStatus);

  return (
    <div className="membership-status">
      <h3>Статус членства</h3>
      <div className={`status-indicator ${statusInfo.className}`}>
        <span className="status-icon" style={{ color: statusInfo.color }}>
          {statusInfo.icon}
        </span>
        <span className="status-text">{statusInfo.title}</span>
      </div>

      {computedStatus === Status.Expiring && daysUntilExpiry !== null && (
        <div className="expiry-warning">
          <p>Членство истекает через {daysUntilExpiry} дней</p>
          <button className="renew-button">Продлить членство</button>
        </div>
      )}

      {(computedStatus === Status.Expired) && (
        <div className="expiry-alert">
          <p>Ваше членство истекло</p>
          <button className="renew-button">Возобновить членство</button>
        </div>
      )}
    </div>
  );
};

export default MembershipStatus;

