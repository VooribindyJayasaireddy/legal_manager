import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const Notification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-l-4 border-blue-500 text-blue-800';
    }
  };

  const getIcon = (type: string) => {
    const iconClass = 'w-6 h-6 flex-shrink-0';
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0">
            <svg className={`${iconClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0">
            <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <svg className={`${iconClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <svg className={`${iconClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-80">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative p-4 pr-10 rounded-lg shadow-md ${getNotificationStyles(notification.type)}`}
          role="alert"
        >
          <div className="flex">
            {getIcon(notification.type)}
            <div className="ml-3">
              {notification.title && (
                <h3 className="text-sm font-medium">{notification.title}</h3>
              )}
              <div className="mt-1 text-sm">
                <p>{notification.message}</p>
                {notification.action && (
                  <div className="mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.action?.onClick();
                        removeNotification(notification.id);
                      }}
                      className="text-sm font-medium hover:underline focus:outline-none"
                    >
                      {notification.action.label}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
