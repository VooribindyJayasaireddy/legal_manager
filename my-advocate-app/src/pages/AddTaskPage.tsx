import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // To access state passed from other pages

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

// Task Form Inputs
interface TaskFormInputs {
    title: string;
    description: string;
    caseId: string;
    clientId: string;
    dueDate: string; // Format: Букмекерлар-MM-DDTHH:MM for input type="datetime-local" if time is needed, else just date
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

interface AddTaskPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const AddTaskPage: React.FC<AddTaskPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const location = useLocation();
    // Pre-populate fields if navigating from CaseDetailsPage (e.g., to "Add Task")
    const preselectCaseId = (location.state as any)?.preselectCaseId || '';
    const preselectClientId = (location.state as any)?.preselectClientId || '';


    const [formData, setFormData] = useState<TaskFormInputs>({
        title: '',
        description: '',
        caseId: preselectCaseId,
        clientId: preselectClientId,
        dueDate: '', // Will be current date + 7 days
        priority: 'medium',
        status: 'pending',
        assignedToId: '', // Will be current user's ID
    });
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);
    const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]); // For assignedTo dropdown, initialized as empty array

    const [errors, setErrors] = useState<TaskFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false); // For form submission
    const [loadingAssociations, setLoadingAssociations] = useState<boolean>(true); // For fetching clients/cases/users

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Set default due date on mount and assignedTo to current user
    useEffect(() => {
        const now = new Date();
        const futureDate = new Date(now.setDate(now.getDate() + 7)); // 7 days from now
        const dueDateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD for input type="date"

        const currentUserId = localStorage.getItem('userId');

        setFormData(prev => ({
            ...prev,
            dueDate: dueDateString,
            assignedToId: currentUserId || '',
        }));
    }, []);

    // Fetch available clients, cases, and users for dropdowns
    const fetchAssociations = useCallback(async () => {
        setLoadingAssociations(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                setLoadingAssociations(false);
                return;
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
            if (clientsResponse.ok) { setAvailableClients(await clientsResponse.json()); } else { console.error('Failed to fetch clients:', clientsResponse.status); }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
            if (casesResponse.ok) { setAvailableCases(await casesResponse.json()); } else { console.error('Failed to fetch cases:', casesResponse.status); }

            // Fetch Users (for assignedTo)
            const usersResponse = await fetch('http://localhost:5000/api/users', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (usersResponse.ok) { 
                const usersData = await usersResponse.json();
                setAvailableUsers(Array.isArray(usersData) ? usersData : []); 
            } else { 
                console.error('Failed to fetch users:', usersResponse.status);
                setAvailableUsers([]);
            }

        } catch (error) {
            console.error('Network error fetching associations:', error);
            setMessage('Network error while loading associated data.');
            setMessageType('error');
        } finally {
            setLoadingAssociations(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchAssociations();
    }, [fetchAssociations]);

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
       const { name, value, type } = e.target;
       const target = e.target as HTMLInputElement; // Type assertion
       
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
        // Due Date is optional, so no validation needed unless specified

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

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const userId = localStorage.getItem('userId');
            if (!token || !userId) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            const apiUrl = 'http://localhost:5000/api/tasks'; // Endpoint to create a new task
            const taskDataToSend = {
                user: userId, // Creator of the task
                title: formData.title,
                description: formData.description || undefined,
                case: formData.caseId || undefined,
                client: formData.clientId || undefined,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                priority: formData.priority,
                status: formData.status,
                assignedTo: formData.assignedToId || undefined,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(taskDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Task created successfully!');
                setMessageType('success');
                console.log('Task created:', data);
                // Clear form after success
                setFormData({
                    title: '', description: '', caseId: '', clientId: '', dueDate: '',
                    priority: 'medium', status: 'pending', assignedToId: userId || '',
                });
                onSuccess(data.message || 'Task created successfully!');
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('Unexpected error creating task. Try again.'); setMessageType('error'); }
            }
        } catch (error) {
            console.error('Network or unexpected error creating task:', error);
            setMessage('Failed to connect to server. Check connection.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingAssociations) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading associated data for form...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Create New Task</h1>
                <p className="text-center text-gray-600 mb-8">Define a new task for your workflow.</p>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <div className={`p-3 mb-4 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title<span className="text-red-500">*</span></label>
                            <input
                                type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Review Client Contract"
                                className={`shadow appearance-none border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
                        </div>

                        {/* Due Date */}
                        <div>
                            <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">Due Date (Optional)</label>
                            <input
                                type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleInputChange}
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.dueDate && <p className="text-red-500 text-xs italic mt-1">{errors.dueDate}</p>}
                        </div>

                        {/* Priority */}
                        <div>
                            <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">Priority<span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    id="priority" name="priority" value={formData.priority} onChange={handleInputChange}
                                    className={`block appearance-none w-full bg-white border ${errors.priority ? 'border-red-500' : 'border-gray-300'} text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                </div>
                            </div>
                            {errors.priority && <p className="text-red-500 text-xs italic mt-1">{errors.priority}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status<span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    id="status" name="status" value={formData.status} onChange={handleInputChange}
                                    className={`block appearance-none w-full bg-white border ${errors.status ? 'border-red-500' : 'border-gray-300'} text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                </div>
                            </div>
                            {errors.status && <p className="text-red-500 text-xs italic mt-1">{errors.status}</p>}
                        </div>

                        {/* Assigned To */}
                        <div>
                            <label htmlFor="assignedToId" className="block text-gray-700 text-sm font-bold mb-2">Assigned To (Optional)</label>
                            <div className="relative">
                                <select
                                    id="assignedToId" name="assignedToId" value={formData.assignedToId} onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="">-- Select a User --</option>
                                    {availableUsers.map(userOption => (
                                        <option key={userOption._id} value={userOption._id}>
                                            {userOption.firstName ? `${userOption.firstName} ${userOption.lastName || ''}` : userOption.username}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Case Association */}
                        <div>
                            <label htmlFor="caseId" className="block text-gray-700 text-sm font-bold mb-2">Case (Optional)</label>
                            <select
                                id="caseId" name="caseId" value={formData.caseId} onChange={handleInputChange}
                                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                            >
                                <option value="">-- Select a Case --</option>
                                {availableCases.map(c => (
                                    <option key={c._id} value={c._id}>{c.caseName} ({c.caseNumber})</option>
                                ))}
                            </select>
                        </div>

                        {/* Client Association */}
                        <div>
                            <label htmlFor="clientId" className="block text-gray-700 text-sm font-bold mb-2">Client (Optional)</label>
                            <select
                                id="clientId" name="clientId" value={formData.clientId} onChange={handleInputChange}
                                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                            >
                                <option value="">-- Select a Client --</option>
                                {availableClients.map(c => (
                                    <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
                        <textarea
                            id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed description of the task"
                            rows={4}
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onBackToList}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-150"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Task...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskPage;
