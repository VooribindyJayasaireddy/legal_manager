import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNotification } from '../contexts/NotificationContext';
import { FiX, FiMenu, FiBell } from 'react-icons/fi';

// Type assertion for icons
const MenuIcon = FiMenu as any;
const XIcon = FiX as any;
const BellIcon = FiBell as any;

interface AppLayoutProps {
    onLogout: () => void;
    userFirstName?: string;
    userUsername?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, userFirstName, userUsername }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { notifications } = useNotification();
    const navigate = useNavigate();
    const userDisplayName = userFirstName || userUsername || 'User';
    
    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isUserMenuOpen && !target.closest('.user-menu')) {
                setIsUserMenuOpen(false);
            }
            if (isNotificationsOpen && !target.closest('.notifications-menu')) {
                setIsNotificationsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen, isNotificationsOpen]);

        const handleNotificationClick = () => {
        // Navigate to notifications page
        navigate('/notifications');
        setIsNotificationsOpen(false);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen w-full bg-gray-100 font-inter overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}



            {/* Sidebar */}
            <div className={`fixed lg:relative z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out h-full`}>
                <Sidebar onLogout={onLogout} onClose={toggleSidebar} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full h-full">
                {/* Top Navigation */}
                <header className="bg-white shadow-sm z-10">
                    <div className="flex items-center justify-between px-4 py-3 lg:px-6">
                        <div className="flex items-center">
                            <button 
                                onClick={toggleSidebar}
                                className="mr-4 text-gray-600 hover:text-gray-900 lg:hidden"
                                aria-label="Toggle sidebar"
                            >
                                {isSidebarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
                            </button>
                            <h1 className="text-xl font-semibold text-gray-800">
                                {document.title || 'Dashboard'}
                            </h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 notifications-menu"
                                    aria-label="Notifications"
                                    aria-expanded={isNotificationsOpen}
                                >
                                    <BellIcon className="w-5 h-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>
                                {isNotificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-700">Notifications</p>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50">
                                                        <p className="text-sm text-gray-700">{notification.message}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(notification.id).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-center text-sm text-gray-500">
                                                    No new notifications
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="px-4 py-2 border-t border-gray-200 text-center">
                                                <button 
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                    onClick={() => {
                                                        navigate('/notifications');
                                                        setIsNotificationsOpen(false);
                                                    }}
                                                >
                                                    View all notifications
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                                        <p className="text-xs text-gray-500">
                                            {notifications.length} new notifications
                                        </p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.map((notification) => (
                                            <div 
                                                key={notification.id}
                                                className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50"
                                            >
                                                <div className="flex items-start">
                                                    <div className={`flex-shrink-0 w-4 h-4 rounded-full ${
                                                        notification.type === 'error' ? 'bg-red-500' :
                                                        notification.type === 'warning' ? 'bg-yellow-500' :
                                                        notification.type === 'info' ? 'bg-blue-500' :
                                                        'bg-green-500'
                                                    }`}>
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date().toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-3 border-t border-gray-200">
                                        <button 
                                            onClick={handleNotificationClick}
                                            className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* User Menu */}
                            <div className="relative user-menu">
                                <button
                                    className="flex items-center space-x-2 focus:outline-none"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    aria-label="User menu"
                                    aria-expanded={isUserMenuOpen}
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                        {userDisplayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700">
                                        {userDisplayName}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                                        <button 
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            onClick={onLogout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
