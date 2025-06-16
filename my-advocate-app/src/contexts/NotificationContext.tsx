import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, options?: {
    title?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }) => string; // Returns notification ID
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((type: NotificationType, message: string, options: {
    title?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  } = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options.duration || (type === 'error' ? 8000 : 5000);
    
    const newNotification: Notification = {
      id,
      type,
      message,
      title: options.title || (type.charAt(0).toUpperCase() + type.slice(1)),
      duration,
      action: options.action,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(id);
      }, duration);
      
      // Store the timer ID in a ref or similar if you need to clear it later
      // For now, we'll just let it run
    }
    
    // Always return the notification ID
    return id;
  }, [removeNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions for common notification types
export const useNotificationHelpers = () => {
  const { addNotification } = useNotification();
  
  return {
    success: (message: string, options?: { title?: string; duration?: number }) => 
      addNotification('success', message, { ...options, title: options?.title || 'Success' }),
      
    error: (message: string, options?: { title?: string; duration?: number }) => 
      addNotification('error', message, { ...options, title: options?.title || 'Error' }),
      
    info: (message: string, options?: { title?: string; duration?: number }) => 
      addNotification('info', message, { ...options, title: options?.title || 'Information' }),
      
    warning: (message: string, options?: { title?: string; duration?: number }) => 
      addNotification('warning', message, { ...options, title: options?.title || 'Warning' }),
      
    // Specialized notifications
    apiError: (error: any, defaultMessage = 'An error occurred') => {
      const message = error?.response?.data?.message || error?.message || defaultMessage;
      return addNotification('error', message, { title: 'Error', duration: 10000 });
    },
    
    // Action notifications
    withAction: (message: string, action: { label: string; onClick: () => void }) => {
      return addNotification('info', message, {
        title: 'Action Required',
        duration: 15000,
        action
      });
    }
  };
};
