import React from 'react';

type SquadNotificationBannerProps = {
  message: string | null;
  onDismiss: () => void;
};

export const SquadNotificationBanner: React.FC<SquadNotificationBannerProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div className="squad-notification-banner" role="status">
      <span className="squad-notification-banner__message">{message}</span>
      <button
        type="button"
        className="squad-notification-banner__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
};

export default SquadNotificationBanner;
