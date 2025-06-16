import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const [filterStatus, setFilterStatus] = useState<string>('All Status');
    const [filterPriority, setFilterPriority] = useState<string>('All Priority');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const apiUrl = 'http://localhost:5000/api/tasks';
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
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch tasks.');
                console.error('Failed to fetch tasks:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching tasks:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const formatDateTime = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled') => {
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
        .filter((task) => {
            const searchContent = `${task.title || ''} ${task.description || ''} ${task.case?.caseName || ''} ${task.client?.firstName || ''} ${task.client?.lastName || ''} ${task.priority} ${task.status} ${task.assignedTo?.firstName || ''} ${task.assignedTo?.lastName || ''}`.toLowerCase();
            const matchesSearch = searchContent.includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All Status' || task.status === filterStatus;
            const matchesPriority = filterPriority === 'All Priority' || task.priority === filterPriority;
            return matchesSearch && matchesStatus && matchesPriority;
        })
        .sort((a, b) => {
            // Sort by most recent creation date
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading tasks...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {error}
                    <button onClick={onLogout} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-inter">
            <main className="p-6 bg-white">
                {/* Top Bar */}
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 hidden sm:block">Tasks</h1>
                    <div className="flex-1 max-w-md mx-4 relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Notification Bell */}
                        <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150">
                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                            </svg>
                        </button>
                        {/* User Avatar */}
                        <div className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 transition duration-150">
                            <img
                                className="w-8 h-8 rounded-full"
                                src={`https://placehold.co/32x32/FF6347/FFFFFF?text=${(localStorage.getItem('firstName') || localStorage.getItem('username') || 'U').charAt(0).toUpperCase()}`}
                                alt="User Avatar"
                            />
                        </div>
                    </div>
                </header>

                {/* Filter and Create Task Buttons */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-4">
                        <button className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 00.54 1.06l1.548.773a11.037 11.037 0 01-6.105 6.105l-.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 00.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V4z"></path>
                            </svg>
                            Filter
                        </button>
                        <button className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 00-2 2v2m0 0a2 2 0 002 2v2m0 0a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"></path>
                            </svg>
                            Status: {filterStatus}
                        </button>
                        <button className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                            </svg>
                            Priority: {filterPriority}
                        </button>
                    </div>
                    <button
                        onClick={onAddTaskClick}
                        className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        New Task
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="text-xl text-gray-700">Loading tasks...</div>
                    </div>
                ) : error ? (
                    <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                        Error: {error}
                    </div>
                ) : filteredAndSortedTasks.length === 0 ? (
                    <p className="text-gray-600 text-center py-10">No tasks found. Create a new task to get started!</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case/Client</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedTasks.map((task) => (
                                    <tr key={task._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {task.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {task.dueDate ? formatDateTime(task.dueDate) : 'No due date'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {task.assignedTo ? (
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8">
                                                        <img
                                                            className="h-8 w-8 rounded-full"
                                                            src={`https://placehold.co/32x32/FF6347/FFFFFF?text=${(task.assignedTo.firstName || task.assignedTo.username).charAt(0).toUpperCase()}`}
                                                            alt="Assigned To"
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {task.assignedTo.firstName || task.assignedTo.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {task.case ? (
                                                <p className="font-semibold">{task.case.caseName} ({task.case.caseNumber})</p>
                                            ) : task.client ? (
                                                <p>{task.client.firstName} {task.client.lastName}</p>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => onViewTask(task._id)} className="text-gray-500 hover:text-blue-600 px-2" title="View">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            </button>
                                            <button onClick={() => onEditTask(task._id)} className="text-gray-500 hover:text-blue-600 px-2" title="Edit">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button onClick={() => onDeleteTask(task._id)} className="text-gray-500 hover:text-red-600 px-2" title="Delete">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TaskList;
