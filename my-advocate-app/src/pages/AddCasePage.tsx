import React, { useState } from 'react';

import ClientSearchSelect from '../components/ClientSearchSelect';

// Define types for Case data based on your schema for form inputs
interface CaseFormInputs {
    caseName: string;
    caseNumber: string;
    description: string;
    // clients: string[]; // Will fetch clients from backend for selection
    status: 'open' | 'pending' | 'closed' | 'on_hold';
    caseType: string;
    startDate: string; // YYYY-MM-DD format for input type="date"
    endDate: string;   // YYYY-MM-DD format for input type="date"
    court: string;
    jurisdiction: string;
    notes: string;
}

// Define types for form errors
interface CaseFormErrors {
    caseName?: string;
    caseNumber?: string;
    description?: string;
    clients?: string;
    status?: string;
    caseType?: string;
    startDate?: string;
    endDate?: string;
    court?: string;
    jurisdiction?: string;
    notes?: string;
    general?: string; // For general form errors not tied to a specific field
}

// Client type for dropdown selection
interface ClientOption {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

interface AddCasePageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const AddCasePage: React.FC<AddCasePageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const [formData, setFormData] = useState<CaseFormInputs>({
        caseName: '',
        caseNumber: '',
        description: '',
        status: 'open',
        caseType: '',
        startDate: new Date().toISOString().split('T')[0], // Default to today
        endDate: '',
        court: '',
        jurisdiction: '',
        notes: '',
    });
    const [selectedClients, setSelectedClients] = useState<string[]>([]); // Array of selected client _ids
 // Clients fetched from API

    const [errors, setErrors] = useState<CaseFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false); // For form submission
    const [loadingClients] = useState<boolean>(false); // For fetching available clients
    const [clientFetchError] = useState<string | null>(null); // Error for fetching clients

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Client selection handler
    const handleClientSelect = (selectedClientIds: string[]) => {
        setSelectedClients(selectedClientIds);
        if (errors.clients) {
            setErrors(prev => ({ ...prev, clients: undefined }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
        if (errors[name as keyof CaseFormErrors]) { setErrors((prevErrors) => ({ ...prevErrors, [name]: '' })); }
        setMessage('');
        setMessageType('');
    };




    const validateForm = (): boolean => {
        const newErrors: CaseFormErrors = {};
        if (!formData.caseName.trim()) newErrors.caseName = 'Case Name is required.';
        if (!formData.status) newErrors.status = 'Status is required.';
        // Make client selection required
        if (selectedClients.length === 0) {
            newErrors.clients = 'Please select at least one client.';
        }

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

            const apiUrl = 'http://localhost:5000/api/cases'; // Endpoint to create a new case
            const caseDataToSend = {
                user: userId,
                caseName: formData.caseName,
                caseNumber: formData.caseNumber || undefined,
                description: formData.description || undefined,
                clients: selectedClients, // Array of client IDs
                status: formData.status,
                caseType: formData.caseType || undefined,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                court: formData.court || undefined,
                jurisdiction: formData.jurisdiction || undefined,
                notes: formData.notes || undefined,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(caseDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Case added successfully!');
                setMessageType('success');
                console.log('Case added:', data);
                // Clear form after successful submission
                setFormData({
                    caseName: '', caseNumber: '', description: '', status: 'open', caseType: '',
                    startDate: new Date().toISOString().split('T')[0], endDate: '', court: '', jurisdiction: '', notes: ''
                });
                setSelectedClients([]); // Clear selected clients
                onSuccess(data.message || 'Case added successfully!'); // Notify parent of success
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('Unexpected error adding case. Try again.'); setMessageType('error'); }
            }
        } catch (error) {
            console.error('Network or unexpected error adding case:', error);
            setMessage('Failed to connect to server. Check connection.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingClients) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading clients for case assignment...</div>
            </div>
        );
    }

    if (clientFetchError) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error loading clients: {clientFetchError}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Case List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Add New Case</h1>
                <p className="text-center text-gray-600 mb-8">Enter the details for your new case below.</p>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <div className={`p-3 mb-4 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Case Name */}
                        <div>
                            <label htmlFor="caseName" className="block text-gray-700 text-sm font-bold mb-2">Case Name<span className="text-red-500">*</span></label>
                            <input
                                type="text" id="caseName" name="caseName" value={formData.caseName} onChange={handleChange} placeholder="e.g., Smith vs. Johnson Dispute"
                                className={`shadow appearance-none border ${errors.caseName ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.caseName && <p className="text-red-500 text-xs italic mt-1">{errors.caseName}</p>}
                        </div>

                        {/* Case Number */}
                        <div>
                            <label htmlFor="caseNumber" className="block text-gray-700 text-sm font-bold mb-2">Case Number</label>
                            <input
                                type="text" id="caseNumber" name="caseNumber" value={formData.caseNumber} onChange={handleChange} placeholder="e.g., 2024-CA-0123"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Case Type */}
                        <div>
                            <label htmlFor="caseType" className="block text-gray-700 text-sm font-bold mb-2">Case Type</label>
                            <input
                                type="text" id="caseType" name="caseType" value={formData.caseType} onChange={handleChange} placeholder="e.g., Real Estate Litigation"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status<span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    id="status" name="status" value={formData.status} onChange={handleChange}
                                    className={`block appearance-none w-full bg-white border ${errors.status ? 'border-red-500' : 'border-gray-300'} text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500`}
                                >
                                    <option value="open">Open</option>
                                    <option value="pending">Pending</option>
                                    <option value="closed">Closed</option>
                                    <option value="on_hold">On Hold</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                </div>
                            </div>
                            {errors.status && <p className="text-red-500 text-xs italic mt-1">{errors.status}</p>}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
                            <input
                                type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange}
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
                            <input
                                type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange}
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Court */}
                        <div>
                            <label htmlFor="court" className="block text-gray-700 text-sm font-bold mb-2">Court</label>
                            <input
                                type="text" id="court" name="court" value={formData.court} onChange={handleChange} placeholder="e.g., Superior Court"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Jurisdiction */}
                        <div>
                            <label htmlFor="jurisdiction" className="block text-gray-700 text-sm font-bold mb-2">Jurisdiction</label>
                            <input
                                type="text" id="jurisdiction" name="jurisdiction" value={formData.jurisdiction} onChange={handleChange} placeholder="e.g., Santa Clara County"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Clients Selection */}
                    <div className="mb-6">
                        <ClientSearchSelect
                            value={selectedClients}
                            onChange={handleClientSelect}
                            onLogout={onLogout}
                            error={errors.clients}
                            isMulti={true}
                        />
                        {loadingClients && (
                            <p className="mt-1 text-sm text-gray-500">Loading clients...</p>
                        )}
                        {clientFetchError && (
                            <p className="mt-1 text-sm text-red-600">{clientFetchError}</p>
                        )}
                        {errors.clients && <p className="text-red-500 text-xs italic mt-1">{errors.clients}</p>}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                        <textarea
                            id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Detailed description of the case"
                            rows={4}
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                        <textarea
                            id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any additional notes for the case"
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
                            {isLoading ? 'Adding Case...' : 'Add Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCasePage;
