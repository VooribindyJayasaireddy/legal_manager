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

// Document Form Inputs (simplified for file upload)
interface DocumentFormInputs {
    title: string;
    description: string;
    tags: string; // Comma-separated string
    caseId: string;
    clientId: string;
}

interface DocumentFormErrors {
    file?: string;
    title?: string; // Update: title is now optional in errors
    description?: string;
    tags?: string;
    caseId?: string;
    clientId?: string;
    general?: string;
}

interface AddDocumentPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

// Utility function to format file size in a human-readable format
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddDocumentPage: React.FC<AddDocumentPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<{
        name: string;
        size: number;
        type: string;
        url?: string;
    } | null>(null);
    
    const [formData, setFormData] = useState<DocumentFormInputs>({
        title: '',
        description: '',
        tags: '',
        caseId: '',
        clientId: '',
    });
    
    // Handle document sharing
    const handleShareDocument = async () => {
        if (!file) {
            setMessage('Please select a document first');
            setMessageType('error');
            return;
        }
        
        if (!shareEmail) {
            setMessage('Please enter an email address');
            setMessageType('error');
            return;
        }

        setIsSharing(true);
        setMessage('');
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            const response = await fetch('http://localhost:5000/api/documents/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    documentId: file.name, // In a real app, use the document ID from the server
                    email: shareEmail,
                    permission: sharePermission
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`Document shared successfully with ${shareEmail} (${sharePermission} access)`);
                setMessageType('success');
                setShareEmail('');
            } else {
                throw new Error(data.message || 'Failed to share document');
            }
        } catch (error) {
            console.error('Error sharing document:', error);
            setMessage(error instanceof Error ? error.message : 'Failed to share document');
            setMessageType('error');
        } finally {
            setIsSharing(false);
        }
    };

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            if (filePreview?.url) {
                URL.revokeObjectURL(filePreview.url);
            }
        };
    }, [filePreview]);
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);

    const [errors, setErrors] = useState<DocumentFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false); // For form submission
    const [loadingAssociations, setLoadingAssociations] = useState<boolean>(true); // For fetching clients/cases

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [shareEmail, setShareEmail] = useState<string>('');
    const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');

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
            const clientsResponse = await fetch('http://localhost:5000/api/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (clientsResponse.ok) {
                setAvailableClients(await clientsResponse.json());
            } else {
                console.error('Failed to fetch clients:', clientsResponse.status);
                setMessage('Failed to load clients for association.');
                setMessageType('error');
            }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (casesResponse.ok) {
                setAvailableCases(await casesResponse.json());
            } else {
                console.error('Failed to fetch cases:', casesResponse.status);
                setMessage('Failed to load cases for association.');
                setMessageType('error');
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


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            
            // Create preview for images
            let previewUrl = '';
            if (selectedFile.type.startsWith('image/')) {
                previewUrl = URL.createObjectURL(selectedFile);
            }
            
            setFilePreview({
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
                url: previewUrl || undefined
            });
            
            // Set title to filename without extension if title is empty
            if (!formData.title) {
                const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove file extension
                setFormData(prev => ({ ...prev, title: fileName }));
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof DocumentFormErrors]) { setErrors(prev => ({ ...prev, [name]: '' })); }
        setMessage('');
        setMessageType('');
    };

    const validateForm = (): boolean => {
        const newErrors: DocumentFormErrors = {};
        
        // Check if file is selected
        if (!file) {
            newErrors.file = 'Please select a file to upload.';
        }
        
        // Check if title is provided
        if (!formData.title || formData.title.trim() === '') {
            newErrors.title = 'Document title is required.';
        }
        
        // Ensure at least one association (case or client) is selected
        // Uncomment this if you want to enforce at least one association
        // if (!formData.caseId && !formData.clientId) {
        //     newErrors.general = 'Document must be associated with a case or a client.';
        // }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');
        setErrors({});

        // Validate form
        if (!validateForm()) {
            setMessage('Please correct the highlighted errors.');
            setMessageType('error');
            return;
        }

        // Ensure a file is selected
        if (!file) {
            setMessage('Please select a file to upload.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            // Log the form data for debugging
            console.log('Submitting form with data:', {
                title: formData.title,
                description: formData.description,
                tags: formData.tags,
                caseId: formData.caseId,
                clientId: formData.clientId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });

            const formDataToSend = new FormData();
            
            // Append the file - ensure this matches the multer field name in the backend
            formDataToSend.append('documentFile', file);
            
            // Append other form data
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('tags', formData.tags);
            
            // Only append caseId and clientId if they have values
            if (formData.caseId) {
                formDataToSend.append('caseId', formData.caseId);
            }
            if (formData.clientId) {
                formDataToSend.append('clientId', formData.clientId);
            }

            // Log the FormData entries for debugging
            Array.from(formDataToSend.entries()).forEach(([key, value]) => {
                console.log(key, value);
            });

            const apiUrl = 'http://localhost:5000/api/documents/upload';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Let the browser set the Content-Type with the correct boundary
                },
                credentials: 'include', // Include cookies for session handling if needed
                body: formDataToSend,
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Document uploaded successfully!');
                setMessageType('success');
                console.log('Document uploaded:', data);
                // Clear form after successful upload
                setFile(null);
                setFormData({ 
                    title: '', 
                    description: '', 
                    tags: '', 
                    caseId: '', 
                    clientId: '' 
                });
                // Notify parent and let it handle the navigation
                onSuccess(data.message || 'Document uploaded successfully!');
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else {
                if ('errors' in data && data.errors) {
                    setErrors(data.errors);
                    setMessage('Please correct the form errors.');
                    setMessageType('error');
                } else if ('message' in data && data.message) {
                    setMessage(data.message);
                    setMessageType('error');
                } else {
                    setMessage('An unexpected error occurred. Please try again.');
                    setMessageType('error');
                }
                console.error('Failed to upload document:', response.status, data);
            }
        } catch (error) {
            console.error('Network or unexpected error uploading document:', error);
            setMessage('Failed to connect to the server. Please check your internet connection and try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingAssociations) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading associated data...</div>
            </div>
        );
    }

    if (message && messageType === 'error') {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {message}
                    <button 
                        onClick={onBackToList} 
                        className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                    >
                        Back to Document List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Upload New Document</h1>
                <p className="text-center text-gray-600 mb-8">Upload a file and associate it with a case or client.</p>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <div className={`p-3 mb-4 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
                            {message}
                        </div>
                    )}

                    {/* File Input */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documentFile">
                            Choose File (Max 10MB)
                        </label>
                        <div className="flex items-center">
                            <label className="flex flex-col w-full px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide border border-blue-300 cursor-pointer hover:bg-blue-50">
                                <div className="flex flex-col items-center justify-center">
                                    <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                                    </svg>
                                    <span className="mt-2 text-base leading-normal">Select a file</span>
                                </div>
                                <input
                                    type="file"
                                    id="documentFile"
                                    name="documentFile"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                />
                            </label>
                        </div>
                        
                        {errors.file && <p className="text-red-500 text-xs italic mt-1">{errors.file}</p>}
                        
                        {filePreview && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    {filePreview.url ? (
                                        <div className="flex-shrink-0">
                                            <img 
                                                src={filePreview.url} 
                                                alt="Preview" 
                                                className="h-16 w-16 object-cover rounded"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0 bg-gray-200 p-3 rounded">
                                            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {filePreview.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(filePreview.size)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                            className="mt-1 text-xs text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Document Title */}
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                            Document Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Enter a title for this document"
                            required
                        />
                        {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
                    </div>

                    {/* Case Association */}
                    <div className="mb-4">
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
                    <div className="mb-4">
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

                    {/* Description */}
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
                        <textarea
                            id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the document"
                            rows={3}
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                    </div>

                    {/* Tags */}
                    <div className="mb-6">
                        <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">Tags (Optional, comma-separated)</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="e.g., contract, agreement, client_id"
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-gray-600 text-xs mt-1">Separate tags with commas (e.g., "invoice, Q1, expenses").</p>
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
                        <div className="mt-4 space-y-4">
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || !file}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Uploading...' : 'Upload Document'}
                                </button>
                                {file && (
                                    <button
                                        type="button"
                                        onClick={() => setIsSharing(!isSharing)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    >
                                        {isSharing ? 'Cancel Sharing' : 'Share Document'}
                                    </button>
                                )}
                            </div>

                            {isSharing && file && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Share Document</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="shareEmail" className="block text-sm font-medium text-gray-700">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="shareEmail"
                                                value={shareEmail}
                                                onChange={(e) => setShareEmail(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Permission Level
                                            </label>
                                            <div className="flex space-x-4">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        checked={sharePermission === 'view'}
                                                        onChange={() => setSharePermission('view')}
                                                    />
                                                    <span className="ml-2 text-gray-700">View Only</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        checked={sharePermission === 'edit'}
                                                        onChange={() => setSharePermission('edit')}
                                                    />
                                                    <span className="ml-2 text-gray-700">Can Edit</span>
                                                </label>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleShareDocument}
                                            disabled={isSharing || !shareEmail}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSharing ? 'Sharing...' : 'Share'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDocumentPage;
