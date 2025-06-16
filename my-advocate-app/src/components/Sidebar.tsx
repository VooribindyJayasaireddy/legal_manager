import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
}

interface SidebarProps {
    onLogout: () => void;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { notifications } = useNotification();
    const unreadCount = notifications.length;

    const isActive = (path: string) => {
        return location.pathname.startsWith(path) ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600';
    };

    return (
        <aside className="w-64 bg-white p-6 shadow-md h-screen sticky top-0 overflow-y-auto">
            <h2 className="text-2xl font-bold text-blue-600 mb-8">ManageFlow</h2>
            <nav>
                <ul className="space-y-2">
                    {/* Dashboard */}
                    <li>
                        <button
                            onClick={() => {
                                navigate('/dashboard');
                                onClose?.();
                            }}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/dashboard')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                            </svg>
                            Dashboard
                        </button>
                    </li>

                    {/* Clients */}
                    <li>
                        <button
                            onClick={() => navigate('/clients')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/clients')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM1 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H3a2 2 0 01-2-2v-2zm6 4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2zm6-4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                            </svg>
                            Clients
                        </button>
                    </li>

                    {/* Cases */}
                    <li>
                        <button
                            onClick={() => navigate('/cases')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/cases')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                            </svg>
                            Cases
                        </button>
                    </li>

                    {/* Documents */}
                    <li>
                        <button
                            onClick={() => navigate('/documents')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/documents')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Documents
                        </button>
                    </li>

                    {/* Appointments */}
                    <li>
                        <button
                            onClick={() => navigate('/appointments')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/appointments')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Appointments
                        </button>
                    </li>

                    {/* Tasks */}
                    <li>
                        <button
                            onClick={() => navigate('/tasks')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/tasks')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Tasks
                        </button>
                    </li>

                    {/* Legal Drafting */}
                    <li>
                        <button
                            onClick={() => navigate('/drafts')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/drafts')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Legal Drafting
                        </button>
                    </li>

                    {/* AI Assistant */}
                    <li>
                        <button
                            onClick={() => navigate('/ai-chat')}
                            className={`flex items-center w-full p-2 rounded-lg transition duration-150 ${isActive('/ai-chat')}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            AI Assistant
                        </button>
                    </li>

                    {/* Notifications */}
                    <li>
                        <button
                            onClick={() => navigate('/notifications')}
                            className={`flex items-center justify-between w-full p-2 rounded-lg transition duration-150 ${isActive('/notifications')} hover:bg-gray-100`}
                        >
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span>Notifications</span>
                            </div>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </li>

                    {/* Settings - Links to Profile */}
                    <li className="pt-4 mt-4 border-t border-gray-200">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center w-full p-2 rounded-lg transition duration-150 hover:bg-gray-100"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Settings
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
