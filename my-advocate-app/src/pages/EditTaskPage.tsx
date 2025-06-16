import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

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

// Define Client type for dropdown selection
interface ClientOption {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

// Define Case type for dropdown selection
interface CaseOption {
    _id: string;
    caseName: string;
    caseNumber?: string;
}

// Define User type for assignedTo dropdown selection
interface UserOption {
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
}

// Task Form Inputs for editing
interface TaskFormInputs {
    title: string;
    description: string;
    caseId: string;
    clientId: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
    assignedToId: string;
}

interface TaskFormErrors {
    title?: string;
    description?: string;
    caseId?: string;
    clientId?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
    assignedToId?: string;
    general?: string;
}

interface EditTaskPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const EditTaskPage: React.FC<EditTaskPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get task ID from URL

    const [formData, setFormData] = useState<TaskFormInputs>({
        title: '', description: '', caseId: '', clientId: '', dueDate: '',
        priority: 'medium', status: 'pending', assignedToId: '',
    });
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);
    const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);

    const [errors, setErrors] = useState<TaskFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial data fetch and form submission
    const [clientFetchError, setClientFetchError] = useState<string | null>(null); // For fetching associated data

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fetch task data and associations to pre-populate the form
    const fetchDataForEdit = useCallback(async () => {
        if (!id) {
            setMessage('Task ID not provided for editing.');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrors({});
        setMessage('');
        setClientFetchError(null);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                setIsLoading(false);
                return;
            }

            // Fetch Task Details
            const taskResponse = await fetch(`http://localhost:5000/api/tasks/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (taskResponse.ok) {
                const taskData: Task = await taskResponse.json();
                setFormData({
                    title: taskData.title || '',
                    description: taskData.description || '',
                    caseId: taskData.case?._id || '',
                    clientId: taskData.client?._id || '',
                    dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
                    priority: taskData.priority,
                    status: taskData.status,
                    assignedToId: taskData.assignedTo?._id || '',
                });
            } else if (taskResponse.status === 404) {
                setMessage('Task not found.');
                setMessageType('error');
                setIsLoading(false);
                return;
            } else if (taskResponse.status === 401 || taskResponse.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
                setIsLoading(false);
                return;
            } else {
                const errorData = await taskResponse.json();
                setMessage(errorData.message || 'Failed to fetch task details.');
                setMessageType('error');
                console.error('Failed to fetch task details for edit:', taskResponse.status, errorData);
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
            if (clientsResponse.ok) { setAvailableClients(await clientsResponse.json()); } else { console.error('Failed to fetch clients:', clientsResponse.status); }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
            if (casesResponse.ok) { setAvailableCases(await casesResponse.json()); } else { console.error('Failed to fetch cases:', casesResponse.status); }

            // Fetch Users
            const usersResponse = await fetch('http://localhost:5000/api/users', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (usersResponse.ok) { 
                const usersData = await usersResponse.json();
                // Handle case where response might be an object with a users array
                const usersArray = Array.isArray(usersData) ? usersData : 
                                  (usersData.users || []);
                setAvailableUsers(usersArray); 
            } else { 
                console.error('Failed to fetch users:', usersResponse.status); 
                setAvailableUsers([]); // Ensure it's always an array
            }


        } catch (error) {
            console.error('Network error fetching task or associations:', error);
            setMessage('Network error while loading data for edit.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchDataForEdit();
    }, [fetchDataForEdit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target as HTMLInputElement; // Type assertion for checkbox handling
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? target.checked : value,
        }));
        if (errors[name as keyof TaskFormErrors]) { 
            setErrors(prev => ({ ...prev, [name]: '' })); 
        }
        setMessage('');
        setMessageType('');
    };

    const validateForm = (): boolean => {
        const newErrors: TaskFormErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.priority) newErrors.priority = 'Priority is required.';
        if (!formData.status) newErrors.status = 'Status is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');
        setErrors({});

        if (!validateForm()) {
            setMessage('Please correct the highlighted errors.');
            setMessageType('error');
            return;
        }

        setIsLoading(true); // Set loading state for submission
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            const apiUrl = `http://localhost:5000/api/tasks/${id}`; // Endpoint for PUT request
            const taskDataToSend = {
                title: formData.title,
                description: formData.description || undefined,
                case: formData.caseId || undefined,
                client: formData.clientId || undefined,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                priority: formData.priority,
                status: formData.status,
                assignedTo: formData.assignedToId || undefined,
                // user, createdAt, updatedAt, completedAt are typically managed by backend on PUT
            };

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(taskDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Task updated successfully!');
                setMessageType('success');
                console.log('Task updated:', data);
                onSuccess(data.message || 'Task updated successfully!'); // Notify parent
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else if (response.status === 404) {
                setMessage('Task not found for update.');
                setMessageType('error');
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('An unexpected error occurred. Please try again.'); setMessageType('error'); }
            }
        } catch (error) {
            console.error('Network or unexpected error updating task:', error);
            setMessage('Failed to connect to server. Check connection.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading task data for edit...</div>
            </div>
        );
    }

    if (!formData.title && !clientFetchError && !message) { // If no data loaded and no explicit error, might be 404 or still loading
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-red-600 mb-4">Task not found or could not be loaded.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Task List</button>
                </div>
            </div>
        );
    }

    if (clientFetchError) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error loading associations: {clientFetchError}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Task List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Task</h1>
                    <p className="text-gray-600">Update the task details below</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <div
                            className={`p-3 mb-6 rounded-lg text-center text-sm ${
                                messageType === 'success' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}
                            role="alert"
                        >
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Title */}
                        <div className="col-span-2">
                            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                                Title<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter task title"
                                className={`shadow appearance-none border ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter task description"
                                rows={4}
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            ></textarea>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.dueDate && <p className="text-red-500 text-xs italic mt-1">{errors.dueDate}</p>}
                        </div>

                        {/* Priority */}
                        <div>
                            <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">
                                Priority<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className={`block appearance-none w-full bg-white border ${
                                        errors.priority ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                                    </svg>
                                </div>
                            </div>
                            {errors.priority && <p className="text-red-500 text-xs italic mt-1">{errors.priority}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
                                Status<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className={`block appearance-none w-full bg-white border ${
                                        errors.status ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                                    </svg>
                                </div>
                            </div>
                            {errors.status && <p className="text-red-500 text-xs italic mt-1">{errors.status}</p>}
                        </div>

                        {/* Assigned To */}
                        <div>
                            <label htmlFor="assignedToId" className="block text-gray-700 text-sm font-bold mb-2">
                                Assigned To
                            </label>
                            <div className="relative">
                                <select
                                    id="assignedToId"
                                    name="assignedToId"
                                    value={formData.assignedToId}
                                    onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Select a User --</option>
                                    {Array.isArray(availableUsers) && availableUsers.map(userOption => (
                                        <option key={userOption._id} value={userOption._id}>
                                            {userOption.firstName 
                                                ? `${userOption.firstName} ${userOption.lastName || ''}` 
                                                : userOption.username}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Case Association */}
                        <div>
                            <label htmlFor="caseId" className="block text-gray-700 text-sm font-bold mb-2">
                                Related Case
                            </label>
                            <div className="relative">
                                <select
                                    id="caseId"
                                    name="caseId"
                                    value={formData.caseId}
                                    onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Select a Case --</option>
                                    {availableCases.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.caseName} {c.caseNumber ? `(${c.caseNumber})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Client Association */}
                        <div>
                            <label htmlFor="clientId" className="block text-gray-700 text-sm font-bold mb-2">
                                Related Client
                            </label>
                            <div className="relative">
                                <select
                                    id="clientId"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Select a Client --</option>
                                    {availableClients.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onBackToList}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskPage;
