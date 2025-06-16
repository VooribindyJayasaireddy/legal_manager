import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Define types for Document data based on your schema
interface Document {
    _id: string;
    user: string; // Advocate ID
    title?: string; // Document title (optional)
    case?: { _id: string; caseName: string; caseNumber?: string }; // Populated Case info
    client?: { _id: string; firstName: string; lastName: string }; // Populated Client info
    fileName: string; // Stored file name
    originalName: string; // Original name provided by user
    fileType: string; // MIME type
    filePath: string; // URL/path to access the file
    fileSize?: number;
    description?: string;
    uploadDate: string; // Date type from schema, but often string from API
    uploadedBy: { _id: string; firstName?: string; lastName?: string; username: string }; // Populated User info
    tags: string[];
}

interface DocumentListPageProps {
    onAddDocumentClick: () => void;
    onViewDocument: (documentId: string) => void;
    onEditDocument: (documentId: string) => void;
    onDeleteDocument: (documentId: string) => void;
    onLogout: () => void;
}

const DocumentList: React.FC<DocumentListPageProps> = ({
    onAddDocumentClick,
    onViewDocument,
    onEditDocument,
    onDeleteDocument,
    onLogout,
}) => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<string>('All Documents');
    const [sortBy, setSortBy] = useState<string>('Recent Uploads');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Format date for display
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
            };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return 'Invalid date';
        }
    };

    // Format file size for display
    const formatFileSize = (bytes: number | undefined): string => {
        if (bytes === undefined || bytes === null) return 'N/A';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Filter and sort documents based on search term and sort option
    const filteredAndSortedDocuments = documents
        .filter((doc: Document) =>
            `${doc.originalName} ${doc.description || ''} ${doc.fileType} ${doc.case?.caseName || ''} ${doc.client?.firstName || ''} ${doc.client?.lastName || ''} ${doc.tags.join(' ')}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a: Document, b: Document) => {
            if (sortBy === 'Recent Uploads') {
                return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
            }
            if (sortBy === 'File Name (A-Z)') {
                return a.originalName.localeCompare(b.originalName);
            }
            return 0;
        });

    // Fetch documents from the API
    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            // Add a timestamp to prevent caching
            const timestamp = new Date().getTime();
            const response = await fetch(`http://localhost:5000/api/documents?t=${timestamp}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch documents');
            }

            const data = await response.json();
            console.log('Fetched documents:', data); // Debug log
            setDocuments(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching documents');
        } finally {
            setIsLoading(false);
        }
    }, [onLogout]);

    // Add event listener for document updates
    useEffect(() => {
        const handleDocumentUpdated = () => {
            fetchDocuments();
        };

        window.addEventListener('documentUpdated', handleDocumentUpdated);
        return () => {
            window.removeEventListener('documentUpdated', handleDocumentUpdated);
        };
    }, [fetchDocuments]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded relative max-w-md w-full mx-4">
                    <strong className="font-bold text-xl block mb-2">Error</strong>
                    <span className="block sm:inline">{error}</span>
                    <button 
                        onClick={onLogout}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
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
                    <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
                    <button
                        onClick={onAddDocumentClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Upload Document
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search documents..."
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

                {/* Documents Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredAndSortedDocuments.map((doc) => {
                                if (!doc || !doc._id) {
                                    console.warn('Invalid document in list:', doc);
                                    return null; // Skip invalid documents
                                }
                                
                                return (
                                    <tr key={doc._id} className="hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium">
                                                        {doc.originalName ? doc.originalName.substring(0, 2).toUpperCase() : '??'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {doc.title || doc.originalName || 'Untitled Document'}
                                                        {doc.title && doc.originalName && (
                                                            <div className="text-xs text-gray-500 truncate" title={doc.originalName}>
                                                                {doc.originalName}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {doc.fileType || 'Unknown type'}{doc.fileSize ? ` • ${formatFileSize(doc.fileSize)}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                            {doc.case?.caseName || 'N/A'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                            {doc.client ? `${doc.client.firstName || ''} ${doc.client.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                            {doc.uploadDate ? formatDate(doc.uploadDate) : 'N/A'}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => onViewDocument(doc._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                                                    title="View Document"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onEditDocument(doc._id)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                                                    title="Edit Document"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteDocument(doc._id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                                                    title="Delete Document"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>  
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DocumentList;
