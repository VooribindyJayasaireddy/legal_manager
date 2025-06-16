import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationTestPage: React.FC = () => {
  const { addNotification } = useNotification();

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred while processing your request.',
      info: 'This is an informational message.',
      warning: 'Warning: This action cannot be undone.'
    };

    addNotification(type, messages[type]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Notification Tester</h1>
        <p className="text-gray-600 mb-8">Click the buttons below to test different notification types.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => showNotification('success')}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Success Notification
          </button>
          
          <button
            onClick={() => showNotification('error')}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Error Notification
          </button>
          
          <button
            onClick={() => showNotification('info')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Info Notification
          </button>
          
          <button
            onClick={() => showNotification('warning')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Warning Notification
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">How to test:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Click any of the buttons above to show a notification</li>
            <li>Notifications will appear in the top-right corner</li>
            <li>They will automatically disappear after 5 seconds</li>
            <li>Click on a notification to dismiss it immediately</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
