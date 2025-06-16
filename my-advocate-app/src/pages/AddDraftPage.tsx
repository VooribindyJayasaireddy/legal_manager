import React, { useState, useEffect, useCallback } from 'react';

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

// Draft Form Inputs
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

interface AddDraftPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const AddDraftPage: React.FC<AddDraftPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const [formData, setFormData] = useState<DraftFormInputs>({
        title: '',
        content: '',
        draftType: '',
        caseId: '',
        clientId: '',
        status: 'in_progress',
        tags: '',
    });
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);

    const [errors, setErrors] = useState<DraftFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false); // For form submission
    const [loadingAssociations, setLoadingAssociations] = useState<boolean>(true); // For fetching clients/cases

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fetch available clients and cases for dropdowns
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof DraftFormErrors]) { setErrors(prev => ({ ...prev, [name]: '' })); }
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

            const apiUrl = 'http://localhost:5000/api/drafts'; // Endpoint to create a new draft
            const draftDataToSend = {
                user: userId,
                title: formData.title,
                content: formData.content,
                draftType: formData.draftType || undefined,
                case: formData.caseId || undefined,
                client: formData.clientId || undefined,
                status: formData.status,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(draftDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Draft created successfully!');
                setMessageType('success');
                console.log('Draft created:', data);
                // Clear form after success
                setFormData({
                    title: '', content: '', draftType: '', caseId: '', clientId: '',
                    status: 'in_progress', tags: '',
                });
                onSuccess(data.message || 'Draft created successfully!');
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('Unexpected error creating draft. Try again.'); setMessageType('error'); }
            }
        } catch (error) {
            console.error('Network or unexpected error creating draft:', error);
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
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Create New Draft</h1>
                <p className="text-center text-gray-600 mb-8">Start a new legal draft document.</p>

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
                                type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Demand Letter for ABC Corp"
                                className={`shadow appearance-none border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
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
                            {isLoading ? 'Creating Draft...' : 'Create Draft'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDraftPage;
