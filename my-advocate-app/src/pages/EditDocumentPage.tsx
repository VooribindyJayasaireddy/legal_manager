import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Utility function to format file size in a human-readable format
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Define types for Document data (from schema)
interface Document {
    _id: string;
    user: string;
    title?: string;
    case?: { _id: string; caseName: string; caseNumber?: string };
    client?: { _id: string; firstName: string; lastName: string };
    fileName: string;
    originalName: string;
    fileType: string;
    filePath: string;
    fileSize?: number;
    description?: string;
    uploadDate: string;
    uploadedBy: { _id: string; firstName?: string; lastName?: string; username: string };
    tags: string[];
}

// Document Form Inputs for editing metadata
interface DocumentFormInputs {
    title: string;
    description: string;
    tags: string; // Comma-separated string
    caseId: string;
    clientId: string;
    file?: File | null;
    originalFileName?: string;
    fileSize?: number;
}

interface DocumentFormErrors {
    title?: string;
    description?: string;
    tags?: string;
    caseId?: string;
    clientId?: string;
    file?: string;
    general?: string;
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

interface EditDocumentPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const EditDocumentPage: React.FC<EditDocumentPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get document ID from URL

    const [formData, setFormData] = useState<DocumentFormInputs>({
        title: '',
        description: '',
        tags: '',
        caseId: '',
        clientId: '',
        file: null,
    });
    
    const [filePreview, setFilePreview] = useState<{
        name: string;
        size: number;
        type: string;
        url?: string; // For image preview URL
    } | null>(null);
    
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
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial data fetch and form submission
    const [clientFetchError, setClientFetchError] = useState<string | null>(null); // For fetching available clients/cases

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fetch available clients and cases for dropdowns and current document details
    const fetchDataForEdit = useCallback(async () => {
        if (!id) {
            setMessage('Document ID not provided for editing.');
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

            // Fetch Document Details
            const docResponse = await fetch(`http://localhost:5000/api/documents/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (docResponse.ok) {
                const docData: Document = await docResponse.json();
                setFormData({
                    title: docData.title || '',
                    description: docData.description || '',
                    tags: docData.tags.join(', ') || '',
                    caseId: docData.case?._id || '',
                    clientId: docData.client?._id || '',
                    originalFileName: docData.originalName || docData.fileName,
                    fileSize: docData.fileSize
                });
                
                if (docData.originalName || docData.fileName) {
                    setFilePreview({
                        name: docData.originalName || docData.fileName,
                        size: docData.fileSize || 0,
                        type: docData.fileType || 'application/octet-stream'
                    });
                }
            } else if (docResponse.status === 404) {
                setMessage('Document not found.');
                setMessageType('error');
                setIsLoading(false);
                return;
            } else if (docResponse.status === 401 || docResponse.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
                setIsLoading(false);
                return;
            } else {
                const errorData = await docResponse.json();
                setMessage(errorData.message || 'Failed to fetch document details.');
                setMessageType('error');
                console.error('Failed to fetch document details for edit:', docResponse.status, errorData);
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (clientsResponse.ok) {
                setAvailableClients(await clientsResponse.json());
            } else {
                console.error('Failed to fetch clients for association:', clientsResponse.status);
                setClientFetchError('Failed to load clients for association.');
            }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (casesResponse.ok) {
                setAvailableCases(await casesResponse.json());
            } else {
                console.error('Failed to fetch cases for association:', casesResponse.status);
                setClientFetchError('Failed to load cases for association.');
            }

        } catch (error) {
            console.error('Network error fetching document or associations:', error);
            setMessage('Network error while loading document or associated data.');
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
        
        // Handle different input types
        const newValue = type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : value;
            
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        // Clear any existing error for this field
        if (errors[name as keyof DocumentFormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Clear any messages
        setMessage('');
        setMessageType('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setErrors(prev => ({ ...prev, file: 'Invalid file type. Please upload an image, PDF, or Word document.' }));
                return;
            }
            
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (selectedFile.size > maxSize) {
                setErrors(prev => ({ ...prev, file: 'File is too large. Maximum size is 10MB.' }));
                return;
            }
            
            // Create preview for images
            let previewUrl = '';
            if (selectedFile.type.startsWith('image/')) {
                previewUrl = URL.createObjectURL(selectedFile);
            }
            
            setFormData(prev => ({ ...prev, file: selectedFile }));
            setFilePreview({
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
                url: previewUrl || undefined
            });
            setErrors(prev => ({ ...prev, file: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: DocumentFormErrors = {};
        // Title is required
        if (!formData.title || formData.title.trim() === '') {
            newErrors.title = 'Document title is required.';
        }
        // Add any specific validation for other fields
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

            const formDataToSend = new FormData();
            
            // Append file if a new one was selected
            if (formData.file) {
                formDataToSend.append('documentFile', formData.file);
            }
            
            // Add other form data
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('tags', formData.tags);
            if (formData.caseId) formDataToSend.append('caseId', formData.caseId);
            if (formData.clientId) formDataToSend.append('clientId', formData.clientId);

            const apiUrl = `http://localhost:5000/api/documents/${id}`; // Endpoint for PUT request
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type header when using FormData - let the browser set it with the correct boundary
                },
                body: formDataToSend,
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Document updated successfully!');
                setMessageType('success');
                console.log('Document updated:', data);
                
                // Show success message and navigate back to documents list
                // The parent component will handle refreshing the list
                onSuccess('Document updated successfully!');
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else if (response.status === 404) {
                setMessage('Document not found for update.');
                setMessageType('error');
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
                console.error('Failed to update document:', response.status, data);
            }
        } catch (error) {
            console.error('Network or unexpected error updating document:', error);
            setMessage('Failed to connect to the server. Please check your internet connection and try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading document data for edit...</div>
            </div>
        );
    }

    if (!formData.description && !clientFetchError && !message) { // If no data loaded and no explicit error, might be 404 or still loading
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-red-600 mb-4">Document not found or could not be loaded.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Document List</button>
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
                        Back to Document List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Edit Document Metadata</h1>
                <p className="text-center text-gray-600 mb-8">Modify the document details below. (File cannot be changed here)</p>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <div className={`p-3 mb-4 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
                            {message}
                        </div>
                    )}

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
                            className={`shadow appearance-none border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="Enter a title for this document"
                            required
                        />
                        {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
                    </div>

                    {/* File Upload/Replace */}
                    <div className="mb-4">
                        <label htmlFor="documentFile" className="block text-gray-700 text-sm font-bold mb-2">
                            {filePreview ? 'Replace Document' : 'Upload New Version (Optional)'}
                        </label>
                        <input
                            type="file"
                            id="documentFile"
                            name="documentFile"
                            onChange={handleFileChange}
                            className={`block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${
                                filePreview ? 'file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                            } ${errors.file ? 'border-red-500' : 'border-gray-300'} border rounded-lg cursor-pointer`}
                        />
                        {errors.file && <p className="text-red-500 text-xs italic mt-1">{errors.file}</p>}
                        
                        {/* Current file info */}
                        {!filePreview && formData.originalFileName && (
                            <p className="text-gray-600 text-sm mt-2">
                                Current file: {formData.originalFileName}
                                {formData.fileSize && ` (${formatFileSize(formData.fileSize)})`}
                            </p>
                        )}
                        
                        {/* New file preview */}
                        {filePreview && (
                            <div className="mt-4 p-4 border rounded bg-gray-50">
                                <p className="text-sm font-medium mb-2">
                                    New file: {filePreview.name} ({formatFileSize(filePreview.size)})
                                </p>
                                {filePreview.url ? (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                                        <img 
                                            src={filePreview.url} 
                                            alt="Preview" 
                                            className="max-h-40 max-w-full border rounded"
                                            onLoad={() => filePreview.url && URL.revokeObjectURL(filePreview.url)}
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded text-sm">
                                        <p>File type preview not available</p>
                                        <p className="text-xs mt-1">Supported previews: JPEG, PNG, GIF</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Brief description of the document"
                            rows={3}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
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

                    {/* Case Association */}
                    <div className="mb-4">
                        <label htmlFor="caseId" className="block text-gray-700 text-sm font-bold mb-2">Associate with Case (Optional)</label>
                        <select
                            id="caseId" 
                            name="caseId" 
                            value={formData.caseId} 
                            onChange={handleInputChange}
                            className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                        >
                            <option value="">-- Select a Case --</option>
                            {availableCases.map(c => (
                                <option key={c._id} value={c._id}>
                                    {c.caseName} {c.caseNumber ? `(${c.caseNumber})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Client Association */}
                    <div className="mb-6">
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

export default EditDocumentPage;
