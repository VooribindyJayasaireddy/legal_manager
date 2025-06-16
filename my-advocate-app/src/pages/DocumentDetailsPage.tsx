import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { downloadDocument } from '../utils/downloadUtils';

// Types
interface UserInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
}

interface CaseInfo {
  _id: string;
  caseName: string;
  caseNumber?: string;
}

interface ClientInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Document {
  _id: string;
  user: string;
  title?: string;
  case?: CaseInfo;
  client?: ClientInfo;
  fileName: string;
  originalName: string;
  fileType: string;
  filePath: string;
  fileSize?: number;
  description?: string;
  uploadDate: string;
  uploadedBy: UserInfo;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface DocumentDetailsPageProps {
  onBackToList: () => void;
  onEditDocument: (documentId: string) => void;
  onDownloadDocument: (documentId: string) => void;
  onLogout: () => void;
}

// Helper function to format file size
const formatFileSize = (bytes: number = 0): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
const DocumentDetailsPage: React.FC<DocumentDetailsPageProps> = ({
  onBackToList,
  onEditDocument,
  onDownloadDocument,
  onLogout
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError('No document ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          onLogout();
          return;
        }

        const response = await fetch(`http://localhost:5000/api/documents/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch document');
        }

        const data = await response.json();
        setDocument(data);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id, onLogout]);

  const handleDownload = useCallback(async () => {
    if (!document?._id) return;
    
    setIsDownloading(true);
    setError(null);
    
    try {
      await downloadDocument(
        document._id,
        document.originalName,
        (errorMessage) => {
          setError(errorMessage);
          if (errorMessage.includes('Authentication required')) {
            onLogout();
          }
        },
        () => {
          // Success callback - show success message if needed
        }
      );
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [document?._id, document?.originalName, onLogout]);

  const handleEdit = useCallback(() => {
    if (document?._id) {
      onEditDocument(document._id);
    }
  }, [document?._id, onEditDocument]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Loading document details...</span>
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Document</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBackToList}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-6">The requested document could not be found.</p>
          <button
            onClick={onBackToList}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
    if (type.includes('image')) return '🖼️';
    return '📄';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBackToList}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Documents
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {document.title || document.originalName}
              </h1>
              {document.title && (
                <p className="text-gray-600 text-sm mt-1">
                  Original filename: {document.originalName}
                </p>
              )}
              <p className="text-gray-500 mt-1">
                Uploaded on {formatDate(document.uploadDate)}
                {document.uploadedBy?.firstName && ` by ${document.uploadedBy.firstName} ${document.uploadedBy.lastName || ''}`}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isDownloading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </>
                )}
              </button>
              
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>
        
        {/* Document Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Document Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and metadata about the document.</p>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              {document.title && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{document.title}</dd>
                </div>
              )}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">File Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{document.originalName}</dd>
              </div>
              
              {document.description && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                    {document.description}
                  </dd>
                </div>
              )}
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">File Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="inline-flex items-center">
                    <span className="mr-2">{getFileIcon(document.fileType)}</span>
                    {document.fileType}
                  </span>
                </dd>
              </div>
              
              {document.fileSize !== undefined && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatFileSize(document.fileSize)}
                  </dd>
                </div>
              )}
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Uploaded On</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(document.uploadDate)}
                </dd>
              </div>
              
              {document.uploadedBy && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Uploaded By</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {document.uploadedBy.firstName} {document.uploadedBy.lastName || ''}
                    {document.uploadedBy.username && ` (@${document.uploadedBy.username})`}
                  </dd>
                </div>
              )}
              
              {document.case && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Related Case</dt>
                  <dd className="mt-1 text-sm text-blue-600 hover:text-blue-800 sm:mt-0 sm:col-span-2">
                    {document.case.caseName}
                    {document.case.caseNumber && ` (${document.case.caseNumber})`}
                  </dd>
                </div>
              )}
              
              {document.client && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {document.client.firstName} {document.client.lastName}
                    {document.client.email && ` (${document.client.email})`}
                  </dd>
                </div>
              )}
              
              {document.tags && document.tags.length > 0 && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Tags</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          
          {/* Document Preview (if image or PDF) */}
          {document.fileType?.startsWith('image/') && (
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="max-w-2xl mx-auto">
                <img 
                  src={`http://localhost:5000/${document.filePath}`} 
                  alt={document.originalName}
                  className="max-w-full h-auto rounded-md border border-gray-200"
                />
              </div>
            </div>
          )}
          
          {/* Removed duplicate action buttons - keeping only the ones in the header */}
          <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailsPage;
    