import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Define types for Draft data
interface Draft {
    _id: string;
    user: { _id: string; firstName?: string; lastName?: string; username: string };
    title: string;
    content: string;
    draftType?: string;
    case?: { _id: string; caseName: string; caseNumber?: string };
    client?: { _id: string; firstName: string; lastName: string; email?: string; phone?: string; };
    status: 'in_progress' | 'under_review' | 'finalized' | 'archived';
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

// Client type for dropdown selection
interface ClientOption {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

// Case type for dropdown selection
interface CaseOption {
    _id: string;
    caseName: string;
    caseNumber?: string;
}

// Draft Form Inputs for editing
interface DraftFormInputs {
    title: string;
    content: string;
    draftType: string;
    caseId: string;
    clientId: string;
    status: 'in_progress' | 'under_review' | 'finalized' | 'archived';
    tags: string; // Comma-separated string
}

interface DraftFormErrors {
    title?: string;
    content?: string;
    draftType?: string;
    caseId?: string;
    clientId?: string;
    status?: string;
    tags?: string;
    general?: string;
}

interface EditDraftPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const EditDraftPage: React.FC<EditDraftPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get draft ID from URL

    const [formData, setFormData] = useState<DraftFormInputs>({
        title: '', content: '', draftType: '', caseId: '', clientId: '',
        status: 'in_progress', tags: '',
    });
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);

    const [errors, setErrors] = useState<DraftFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial data fetch and form submission
    const [clientFetchError, setClientFetchError] = useState<string | null>(null); // For fetching associated data

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fetch draft data and associations to pre-populate the form
    const fetchDataForEdit = useCallback(async () => {
        if (!id) {
            setMessage('Draft ID not provided for editing.');
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

            // Fetch Draft Details
            const draftResponse = await fetch(`http://localhost:5000/api/drafts/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (draftResponse.ok) {
                const draftData: Draft = await draftResponse.json();
                setFormData({
                    title: draftData.title || '',
                    content: draftData.content || '',
                    draftType: draftData.draftType || '',
                    caseId: draftData.case?._id || '',
                    clientId: draftData.client?._id || '',
                    status: draftData.status,
                    tags: draftData.tags.join(', ') || '',
                });
            } else if (draftResponse.status === 404) {
                setMessage('Draft not found.');
                setMessageType('error');
                setIsLoading(false);
                return;
            } else if (draftResponse.status === 401 || draftResponse.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
                setIsLoading(false);
                return;
            } else {
                const errorData = await draftResponse.json();
                setMessage(errorData.message || 'Failed to fetch draft details.');
                setMessageType('error');
                console.error('Failed to fetch draft details for edit:', draftResponse.status, errorData);
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
            if (clientsResponse.ok) { setAvailableClients(await clientsResponse.json()); } else { console.error('Failed to fetch clients:', clientsResponse.status); }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
            if (casesResponse.ok) { setAvailableCases(await casesResponse.json()); } else { console.error('Failed to fetch cases:', casesResponse.status); }

        } catch (error) {
            console.error('Network error fetching draft or associations:', error);
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof DraftFormErrors]) { 
            setErrors(prev => ({ ...prev, [name]: '' })); 
        }
        setMessage('');
        setMessageType('');
    };

    const validateForm = (): boolean => {
        const newErrors: DraftFormErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.content.trim()) newErrors.content = 'Content is required.';
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

            const apiUrl = `http://localhost:5000/api/drafts/${id}`; // Endpoint for PUT request
            const draftDataToSend = {
                title: formData.title,
                content: formData.content,
                draftType: formData.draftType || undefined,
                case: formData.caseId || null,
                client: formData.clientId || null,
                status: formData.status,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
            };

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(draftDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Draft updated successfully!');
                setMessageType('success');
                console.log('Draft updated:', data);
                onSuccess(data.message || 'Draft updated successfully!');
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else if (response.status === 404) {
                setMessage('Draft not found for update.');
                setMessageType('error');
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('An unexpected error occurred. Please try again.'); setMessageType('error'); }
                console.error('Failed to update draft:', response.status, data);
            }
        } catch (error) {
            console.error('Network or unexpected error updating draft:', error);
            setMessage('Failed to connect to server. Check connection.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading draft data for edit...</div>
            </div>
        );
    }

    if (!formData.title && !clientFetchError && !message) { // If no data loaded and no explicit error, might be 404 or still loading
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-red-600 mb-4">Draft not found or could not be loaded.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Draft List</button>
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
                        Back to Draft List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Edit Draft</h1>
                <p className="text-center text-gray-600 mb-8">Modify the draft document and its metadata.</p>

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
                            <div className="relative">
                                <input
                                    type="text" 
                                    id="title" 
                                    name="title" 
                                    value={formData.title} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g., Demand Letter"
                                    className={`shadow appearance-none border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {formData.title && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        title="Clear title"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
                        </div>

                        {/* Draft Type */}
                        <div>
                            <label htmlFor="draftType" className="block text-gray-700 text-sm font-bold mb-2">Draft Type (Optional)</label>
                            <input
                                type="text" id="draftType" name="draftType" value={formData.draftType} onChange={handleInputChange} placeholder="e.g., Contract, Letter, Memo"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.draftType && <p className="text-red-500 text-xs italic mt-1">{errors.draftType}</p>}
                        </div>

                        {/* Case Association */}
                        <div>
                            <label htmlFor="caseId" className="block text-gray-700 text-sm font-bold mb-2">Associate with Case (Optional)</label>
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
                            <label htmlFor="clientId" className="block text-gray-700 text-sm font-bold mb-2">Associate with Client (Optional)</label>
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

                    {/* Content (Main Editor Area) */}
                    <div className="mb-6">
                        <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">Draft Content<span className="text-red-500">*</span></label>
                        <textarea
                            id="content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Start writing your legal draft here..."
                            rows={15}
                            className={`shadow appearance-none border ${errors.content ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm`}
                        ></textarea>
                        {errors.content && <p className="text-red-500 text-xs italic mt-1">{errors.content}</p>}
                    </div>

                    {/* Status and Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status</label>
                            <div className="relative">
                                <select
                                    id="status" name="status" value={formData.status} onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="in_progress">In Progress</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="finalized">Finalized</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                </div>
                            </div>
                        </div>
                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">Tags (Optional, comma-separated)</label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleInputChange}
                                placeholder="e.g., contract, agreement, draft"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-gray-600 text-xs mt-1">Separate tags with commas.</p>
                        </div>
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
                            {isLoading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDraftPage;
