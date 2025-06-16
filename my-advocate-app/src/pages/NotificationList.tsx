import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Define Notification type based on backend response
interface Notification {
    _id: string;
    type: 'appointment' | 'task' | 'document';
    title: string;
    message: string;
    date: string;
    read: boolean;
    entityId: string;
    entityType: 'appointment' | 'task' | 'document';
    status?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationListPageProps {
    onLogout: () => void;
}

const NotificationList: React.FC<NotificationListPageProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const [reminders, setReminders] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState<boolean>(true); // Sidebar submenu state

    const fetchReminders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const apiUrl = 'http://localhost:5000/api/notifications'; // Your backend endpoint
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data: Notification[] = await response.json();
                setReminders(data);
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch reminders.');
                console.error('Failed to fetch reminders:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching reminders:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const handleMarkAsSeen = async (entityType: 'appointment' | 'task' | 'document', entityId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Authentication required.');
                onLogout();
                return;
            }

            const apiUrl = `http://localhost:5000/api/notifications/${entityType}/${entityId}/mark-as-read`;
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                alert('Notification marked as read!');
                fetchReminders(); // Re-fetch to update the list
            } else if (response.status === 401 || response.status === 403) {
                alert('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to mark reminder as seen.');
            }
        } catch (error) {
            console.error('Error marking reminder as seen:', error);
            alert('Network error or unexpected issue.');
        }
    };

    const handleViewEntity = (entityType: 'appointment' | 'task' | 'document', entityId: string) => {
        switch (entityType) {
            case 'appointment':
                navigate(`/appointments/${entityId}`);
                break;
            case 'task':
                navigate(`/tasks/${entityId}`);
                break;

                break;
            case 'document':
                navigate(`/documents/${entityId}`);
                break;
            default:
                console.error(`Unknown entity type: ${entityType}`);
        }
    };

    const formatDateTime = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    const getIconForType = (type: 'appointment' | 'task' | 'document') => {
        if (type === 'appointment') {
            return <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>;
        }
        if (type === 'task') {
            return <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M9.031 2.399a1.5 1.5 0 011.938 0l.966.527a1.5 1.5 0 001.966.302l.711-.355a1.5 1.5 0 011.916.892l.182.999a1.5 1.5 0 00.99 1.488l.999.182a1.5 1.5 0 01.892 1.916l-.355.711a1.5 1.5 0 00.302 1.966l.527.966a1.5 1.5 0 010 1.938l-.527.966a1.5 1.5 0 00-.302 1.966l.355.711a1.5 1.5 0 01-.892 1.916l-.999.182a1.5 1.5 0 00-1.488.99l-.182.999a1.5 1.5 0 01-1.916.892l-.711-.355a1.5 1.5 0 00-1.966-.302l-.966.527a1.5 1.5 0 01-1.938 0l-.966-.527a1.5 1.5 0 00-1.966-.302l-.711.355a1.5 1.5 0 01-1.916-.892l-.182-.999a1.5 1.5 0 00-.99-1.488l-.999-.182a1.5 1.5 0 01-.892-1.916l.355-.711a1.5 1.5 0 00-.302-1.966l-.527-.966a1.5 1.5 0 010-1.938l.527-.966a1.5 1.5 0 00.302-1.966l-.355-.711a1.5 1.5 0 01.892-1.916l.999-.182a1.5 1.5 0 001.488-.99l.182-.999a1.5 1.5 0 011.916-.892l.711.355a1.5 1.5 0 001.966.302z" clipRule="evenodd"></path></svg>;
        }
        if (type === 'document') {
            return <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 3.414L16.586 7A2 2 0 0117 8.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>;
        }
        return null;
    };

    const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
        switch (priority) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'on_hold': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-inter">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Notifications List */}
                    {!isLoading && !error && (
                        <div className="space-y-4">
                            {reminders.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                                    <p className="mt-1 text-sm text-gray-500">You don't have any notifications yet.</p>
                                </div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {reminders.map((reminder) => (
                                            <li key={reminder._id} className={`${!reminder.read ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50`}>
                                                <div 
                                                    className="px-4 py-4 sm:px-6 cursor-pointer"
                                                    onClick={() => handleViewEntity(reminder.entityType, reminder.entityId)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0">
                                                                {getIconForType(reminder.type)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {reminder.title}
                                                                    {reminder.priority && (
                                                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                                                                            {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 mt-1">{reminder.message}</p>
                                                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                                                    <span>{formatDateTime(reminder.date)}</span>
                                                                    {reminder.status && (
                                                                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(reminder.status)}`}>
                                                                            {reminder.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {!reminder.read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsSeen(reminder.entityType, reminder.entityId);
                                                                }}
                                                                className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                Mark as read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationList;
