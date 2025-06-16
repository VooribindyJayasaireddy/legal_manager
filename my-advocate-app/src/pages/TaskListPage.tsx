import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Define types for Task data
interface Task {
    _id: string;
    user: string; // User ID (creator)
    title: string;
    description?: string;
    case?: { _id: string; caseName: string; caseNumber?: string }; // Populated Case info
    client?: { _id: string; firstName: string; lastName: string }; // Populated Client info
    dueDate?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
    assignedTo?: { _id: string; firstName?: string; lastName?: string; username: string }; // Populated User info
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface TaskListPageProps {
    onAddTaskClick: () => void;
    onViewTask: (taskId: string) => void;
    onEditTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onLogout: () => void;
}

const TaskList: React.FC<TaskListPageProps> = ({
    onAddTaskClick,
    onViewTask,
    onEditTask,
    onDeleteTask,
    onLogout,
}) => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<string>('All Tasks'); // Placeholder for filter
    const [sortBy, setSortBy] = useState<string>('Recent Updates'); // Placeholder for sort
    const [isTasksLoading, setIsTasksLoading] = useState<boolean>(true);
    const [tasksError, setTasksError] = useState<string | null>(null);
    const fetchTasks = useCallback(async () => {
        setIsTasksLoading(true);
        setTasksError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setTasksError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const apiUrl = 'http://localhost:5000/api/tasks'; // Your backend endpoint to get all tasks
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: Task[] = await response.json();
                setTasks(data);
            } else if (response.status === 401 || response.status === 403) {
                setTasksError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setTasksError(errorData.message || 'Failed to fetch tasks: An unknown error occurred.');
                console.error('Failed to fetch tasks:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching tasks:', err);
            setTasksError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsTasksLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
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

    const filteredAndSortedTasks = tasks
        .filter((task) =>
            `${task.title} ${task.description || ''} ${task.case?.caseName || ''} ${task.client?.firstName || ''} ${task.client?.lastName || ''} ${task.priority} ${task.status}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'Recent Updates') {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            if (sortBy === 'Due Date') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
                return dateA - dateB;
            }
            // Add other sorting logic here if needed (e.g., by priority)
            return 0;
        });

    if (isTasksLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading tasks...</div>
            </div>
        );
    }

    if (tasksError) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {tasksError}
                    <button onClick={onLogout} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
                    <button
                        onClick={onAddTaskClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Task
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isTasksLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error State */}
                {tasksError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{tasksError}</span>
                    </div>
                )}

                {/* Tasks List */}
                {!isTasksLoading && !tasksError && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAndSortedTasks.length > 0 ? (
                                    filteredAndSortedTasks.map((task) => (
                                        <tr key={task._id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-medium">
                                                            {task.title.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {task.title}
                                                        </div>
                                                        {task.description && (
                                                            <div className="text-sm text-gray-500 line-clamp-1">
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-500">
                                                {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeClass(task.priority)}`}>
                                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(task.status)}`}>
                                                    {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-500">
                                                {task.case ? `${task.case.caseName} (${task.case.caseNumber})` : 'No case'}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onViewTask(task._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                                                        title="View Task"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onEditTask(task._id)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                                                        title="Edit Task"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteTask(task._id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                                                        title="Delete Task"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            No tasks found. {searchTerm ? 'Try a different search term.' : 'Add your first task to get started.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskList;
