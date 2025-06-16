import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Define types for Task data
interface Task {
    _id: string;
    user: string; // User ID (creator)
    title: string;
    description?: string;
    case?: { _id: string; caseName: string; caseNumber?: string }; // Populated Case info
    client?: { _id: string; firstName: string; lastName: string; email?: string; phone?: string; }; // Populated Client info
    dueDate?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
    assignedTo?: { _id: string; firstName?: string; lastName?: string; username: string }; // Populated User info
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface TaskDetailsPageProps {
    onBackToList: () => void;
    onEditTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => Promise<void>;
    onLogout: () => void;
}

const TaskDetailsPage: React.FC<TaskDetailsPageProps> = ({ onBackToList, onEditTask, onDeleteTask, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get task ID from URL
    const navigate = useNavigate();
    const [taskDetails, setTaskDetails] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTaskDetails = useCallback(async () => {
        if (!id) {
            setError('Task ID not provided in URL.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const apiUrl = `http://localhost:5000/api/tasks/${id}`; // Your backend endpoint to get a single task
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: Task = await response.json();
                setTaskDetails(data);
            } else if (response.status === 404) {
                setError('Task not found.');
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch task details.');
                console.error('Failed to fetch task details:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching task details:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    const formatDateTime = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return dateString;
        }
    };

    const formatDateOnly = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    const getPriorityBadgeClass = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeClass = (status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled') => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'on_hold': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading task details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {error}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Task List
                    </button>
                </div>
            </div>
        );
    }

    if (!taskDetails) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-gray-700 mb-4">Task data not available.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Task List</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <button
                            onClick={onBackToList}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Tasks
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {taskDetails.title}
                        </h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => onEditTask(taskDetails._id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Task
                        </button>
                        <button
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                                    await onDeleteTask(taskDetails._id);
                                }
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Task Information
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Task details and status information
                        </p>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl className="divide-y divide-gray-200">
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Title</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {taskDetails.title}
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {taskDetails.description || 'No description provided'}
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(taskDetails.status)}`}>
                                        {taskDetails.status.replace('_', ' ').charAt(0).toUpperCase() + taskDetails.status.replace('_', ' ').slice(1)}
                                    </span>
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(taskDetails.priority)}`}>
                                        {taskDetails.priority.charAt(0).toUpperCase() + taskDetails.priority.slice(1)} Priority
                                    </span>
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {taskDetails.dueDate ? formatDateOnly(taskDetails.dueDate) : 'No due date set'}
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {taskDetails.assignedTo ? `${taskDetails.assignedTo.firstName || taskDetails.assignedTo.username}` : 'Unassigned'}
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {taskDetails.user}
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatDateTime(taskDetails.createdAt)}
                                </dd>
                            </div>
                            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatDateTime(taskDetails.updatedAt)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Case Information */}
                {(taskDetails.case || taskDetails.client) && (
                    <div className="bg-white p-6 rounded-lg shadow-md mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {taskDetails.case && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Case Information</h3>
                                <div className="space-y-3">
                                    <p><strong>Reference Number:</strong> {taskDetails.case.caseNumber || 'N/A'}</p>
                                    <p><strong>Case Title:</strong> {taskDetails.case.caseName}</p>
                                </div>
                            </div>
                        )}
                        {taskDetails.client && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Client Information</h3>
                                <div className="space-y-3">
                                    <p><strong>Client Name:</strong> {taskDetails.client.firstName} {taskDetails.client.lastName}</p>
                                    <p><strong>Contact Person:</strong> {taskDetails.client.firstName} {taskDetails.client.lastName}</p> {/* Assuming client is the contact */}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetailsPage;
