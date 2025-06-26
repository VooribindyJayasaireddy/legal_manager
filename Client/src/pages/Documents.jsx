import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, Search, Upload, Plus, X, File, FileDigit, FileClock, Trash2, Eye, Edit, Save } from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '', show: false });
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    documentType: 'all',
    caseId: 'all',
    tag: 'all',
  });
  
  // Form state for upload
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [caseError, setCaseError] = useState(null);

  // Form state for upload
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: 'standalone',
    caseId: '',
    tags: '',
    file: null,
  });
  
  const [errors, setErrors] = useState({});

  // Fetch cases for the case selection dropdown
  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      setCaseError(null);
      const response = await api.get('/cases');
      setCases(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setCaseError('Failed to load cases. Please try again.');
    } finally {
      setLoadingCases(false);
    }
  };

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.documentType !== 'all') params.append('documentType', filters.documentType);
      if (filters.caseId !== 'all') params.append('caseId', filters.caseId);
      if (filters.tag !== 'all') params.append('tag', filters.tag);
      
      const response = await api.get(`/documents?${params.toString()}`);
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  // Handle file upload
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Document title is required';
    }
    
    if (formData.documentType === 'case' && !formData.caseId) {
      newErrors.caseId = 'Please select a case for this document';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const formDataToSend = new FormData();
    formDataToSend.append('file', formData.file);
  
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('documentType', formData.documentType);
    if (formData.caseId) formDataToSend.append('caseId', formData.caseId);
    if (formData.tags) formDataToSend.append('tags', formData.tags);
    
    try {
      const response = await api.post('/documents/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh documents list
      await fetchDocuments();
      setShowUploadModal(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        documentType: 'standalone',
        caseId: '',
        tags: '',
        file: null,
      });
      
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };



  // Handle document delete confirmation
  const confirmDeleteDocument = (doc) => {
    setDeletingDocId(doc._id);
    setShowDeleteModal(true);
  };

  // Handle document delete
  const handleDeleteDocument = async () => {
    if (!deletingDocId) return;
    
    try {
      // Show loading state
      setDeletingDocId(deletingDocId);
      
      // Make the API call to delete the document
      await api.delete(`/documents/${deletingDocId}`);
      
      // Remove the deleted document from the list
      setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== deletingDocId));
      
      // Close any open document viewer if the deleted document was being viewed
      if (viewingDocument && viewingDocument._id === deletingDocId) {
        setViewingDocument(null);
      }
      
      // Show success message
      showNotification('success', 'Document deleted successfully');
    } catch (err) {
      console.error('Error deleting document:', err);
      showNotification('error', err.response?.data?.message || 'Failed to delete document. Please try again.');
    } finally {
      // Reset states
      setShowDeleteModal(false);
      setDeletingDocId(null);
    }
  };

  // State for modals and loading states
  const [showCaseDeleteModal, setShowCaseDeleteModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeletingCase, setIsDeletingCase] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  // Handle case delete confirmation
  const confirmDeleteCase = (caseId) => {
    setCaseToDelete(caseId);
    setShowCaseDeleteModal(true);
  };

  // Show delete confirmation
  const confirmDelete = (docId) => {
    setDeletingDocId(docId);
    setShowDeleteModal(true);
  };

  // Handle case delete
  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    
    try {
      setIsDeletingCase(true);
      await api.delete(`/cases/${caseToDelete}`);
      
      // Remove the case from the cases list
      setCases(cases.filter(c => c._id !== caseToDelete));
      
      // Remove documents associated with this case
      setDocuments(documents.filter(doc => doc.caseId !== caseToDelete));
      
      // Reset filters if the deleted case was selected
      if (filters.caseId === caseToDelete) {
        setFilters(prev => ({ ...prev, caseId: 'all' }));
      }
      
      // Show success message
      showNotification('success', 'Case and associated documents deleted successfully');
      
      // Close the modal
      setShowCaseDeleteModal(false);
      setCaseToDelete(null);
    } catch (err) {
      console.error('Error deleting case:', err);
      showNotification('error', err.response?.data?.message || 'Failed to delete case');
    } finally {
      setIsDeletingCase(false);
    }
  };

  // Removed handleViewDocument as we're showing all details in the list view

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle document click
  const handleDocumentClick = async (doc, e) => {
    // Don't trigger if clicking on action buttons
    if (e.target.closest('button')) {
      return;
    }
    
    // Open document in viewer
    await handleViewDocument(doc, e);
    setShowDocumentViewer(true);
  };

  // Handle view document
  const handleViewDocument = async (doc, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setViewingDocument(doc);
    setIsLoadingDocument(true);
    setDocumentError(null);
    setDocumentContent(null);

    try {
      // First try direct view if fileUrl is available
      if (doc.fileUrl) {
        setDocumentContent({
          type: 'embed',
          url: doc.fileUrl,
          name: doc.fileName || doc.title || 'document'
        });
        return;
      }

      // If no direct URL, try API endpoints
      let response;
      try {
        // First try with /documents/:id/download
        response = await api.get(`/documents/${doc._id}/download`, {
          responseType: 'blob',
          validateStatus: () => true // Don't throw for any status
        });

        // If 404, try the fallback endpoint
        if (response.status === 404) {
          response = await api.get(`/documents/download/${doc._id}`, {
            responseType: 'blob',
            validateStatus: () => true
          });
        }
        
        if (response.status === 200) {
          const blob = new Blob([response.data]);
          const fileType = doc.fileType?.toLowerCase() || 'application/octet-stream';
          const url = URL.createObjectURL(blob);
          
          // Check file type to determine how to display
          if (fileType === 'pdf') {
            setDocumentContent({
              type: 'pdf',
              url: url,
              name: doc.fileName || doc.title || 'document.pdf'
            });
          } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
            setDocumentContent({
              type: 'image',
              url: url,
              name: doc.fileName || doc.title || `image.${fileType}`,
              mimeType: `image/${fileType}`
            });
          } else if (fileType === 'txt' || fileType === 'text/plain') {
            const text = await blob.text();
            setDocumentContent({
              type: 'text',
              content: text,
              name: doc.fileName || doc.title || 'document.txt'
            });
          } else {
            // For unsupported types, show download option
            setDocumentContent({
              type: 'download',
              url: url,
              name: doc.fileName || doc.title || 'document',
              mimeType: fileType
            });
            showNotification('info', 'This file type cannot be viewed. Please download it instead.');
          }
          return;
        }
        
        throw new Error(`Server responded with status: ${response.status}`);
        
      } catch (error) {
        console.error('Error loading document:', error);
        setDocumentError('Failed to load document. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setDocumentError('An error occurred while processing the document.');
    } finally {
      setIsLoadingDocument(false);
    }
  };

  // Handle edit button click
  const handleEditClick = () => {
    setEditingDocument({ ...viewingDocument });
    setIsEditing(true);
  };

  // Handle edit input change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit tags change
  const handleTagsChange = (e) => {
    const tags = e.target.value;
    setEditingDocument(prev => ({
      ...prev,
      tags: tags
    }));
  };

  // Handle save document
  const handleSaveDocument = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!editingDocument) {
      console.error('No document is being edited');
      showNotification('error', 'No document is being edited');
      return;
    }

    // Show loading state
    const loadingNotification = showNotification('info', 'Updating document...', true);
    
    try {
      // Prepare the data to send
      const updateData = {
        title: editingDocument.title?.trim(),
        description: editingDocument.description?.trim() || '',
        documentType: editingDocument.documentType || 'standalone',
        tags: Array.isArray(editingDocument.tags) 
          ? editingDocument.tags 
          : (editingDocument.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      // Validate required fields
      if (!updateData.title) {
        loadingNotification.update('error', 'Document title is required');
        return;
      }

      console.log('Updating document with data:', updateData);
      console.log('Document ID:', editingDocument._id);
      
      try {
        // Make the API call
        const response = await api.put(`/documents/${editingDocument._id}`, updateData);
        
        if (response && response.data) {
          console.log('Update successful, response:', response.data);
          
          // Create the updated document object with all necessary fields
          const updatedDocument = {
            ...editingDocument,
            ...response.data,
            title: updateData.title,
            description: updateData.description,
            documentType: updateData.documentType,
            tags: updateData.tags,
            updatedAt: new Date().toISOString()
          };
          
          // Update the documents list
          setDocuments(prev => prev.map(doc => 
            doc._id === editingDocument._id ? updatedDocument : doc
          ));
          
          // Update the viewing document
          setViewingDocument(updatedDocument);
          setIsEditing(false);
          setEditingDocument(null);
          
          // Show success message
          loadingNotification.update('success', 'Document updated successfully');
          
          // Refresh the documents list to ensure we have the latest data
          fetchDocuments();
        } else {
          console.error('Invalid response format:', response);
          throw new Error('Invalid response format from server');
        }
      } catch (apiError) {
        console.error('API Error Details:', {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            data: apiError.config?.data
          }
        });
        
        let errorMessage = 'Failed to update document. Please try again.';
        
        if (apiError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (apiError.response.status === 404) {
            errorMessage = 'Document not found. It may have been deleted.';
          } else if (apiError.response.status === 401 || apiError.response.status === 403) {
            errorMessage = 'You do not have permission to update this document.';
          } else if (apiError.response.data && apiError.response.data.message) {
            errorMessage = apiError.response.data.message;
          } else {
            errorMessage = `Server error: ${apiError.response.status} ${apiError.response.statusText}`;
          }
        } else if (apiError.request) {
          // The request was made but no response was received
          errorMessage = 'No response from server. Please check your connection.';
        } else if (apiError.message) {
          // Something happened in setting up the request that triggered an Error
          errorMessage = `Request error: ${apiError.message}`;
        }
        
        // Update the notification with the error message
        loadingNotification.update('error', errorMessage);
        
        // Re-throw to be caught by outer catch
        throw apiError;
      }
    } catch (err) {
      console.error('Unexpected error in handleSaveDocument:', err);
      // Error notification is already shown in the inner catch
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDocument(null);
  };

  // Close document viewer
  const closeDocumentViewer = () => {
    setViewingDocument(null);
    setEditingDocument(null);
    setIsEditing(false);
    setDocumentContent(null);
    setDocumentError(null);
    setIsLoadingDocument(false);
  };

  // Handle document download
  const handleDownload = async (doc, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!doc?._id) {
      console.error('No document ID provided for download');
      showNotification('error', 'Invalid document');
      return;
    }

    try {
      // First try direct download if fileUrl is available
      if (doc.fileUrl) {
        const directLink = document.createElement('a');
        directLink.href = doc.fileUrl;
        directLink.download = doc.fileName || doc.title || 'document';
        document.body.appendChild(directLink);
        directLink.click();
        document.body.removeChild(directLink);
        showNotification('success', 'Download started');
        return;
      }

      // If no direct URL, try API endpoints
      let response;
      try {
        // First try with /documents/:id/download
        response = await api.get(`/documents/${doc._id}/download`, {
          responseType: 'blob',
          validateStatus: () => true // Don't throw for any status
        });

        // If 404, try the fallback endpoint
        if (response.status === 404) {
          response = await api.get(`/documents/download/${doc._id}`, {
            responseType: 'blob',
            validateStatus: () => true
          });
        }
        
        if (response.status === 200) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', doc.fileName || doc.title || 'document');
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          setTimeout(() => {
            link.remove();
            window.URL.revokeObjectURL(url);
          }, 100);
          
          showNotification('success', 'Download started');
          return;
        }
        
        throw new Error(`Server responded with status: ${response.status}`);
        
      } catch (error) {
        console.error('Error details:', {
          error: error.toString(),
          message: error.message,
          response: error.response?.data ? 
            (typeof error.response.data === 'object' ? 
             JSON.stringify(error.response.data) : 
             error.response.data.toString().substring(0, 500)) : 'No response data',
          status: error.response?.status,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        const errorMessage = error.response?.data?.message || 
                         (error.response?.status === 404 ? 'Document not found' : 
                          'Failed to download document. Please try again later.');
        showNotification('error', errorMessage);
      }
    } catch (error) {
      console.error('Unexpected error in handleDownload:', error);
      showNotification('error', 'An unexpected error occurred while processing your request');
    }
  };

  // Helper function to handle file download
  const handleFileDownload = (fileData, fileName) => {
    try {
      const url = window.URL.createObjectURL(new Blob([fileData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      showNotification('success', 'Document download started');
    } catch (err) {
      console.error('Error creating download link:', err);
      showNotification('error', 'Error preparing file for download');
    }
  };

  // Handle document update
  const handleDocumentUpdate = (updatedDoc) => {
    setDocuments(docs => 
      docs.map(doc => doc._id === updatedDoc._id ? updatedDoc : doc)
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="h-5 w-5" />;
    
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileDigit className="h-5 w-5 text-green-500" />;
    if (fileType.includes('image')) return <FileText className="h-5 w-5 text-yellow-500" />;
    
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''), // Set title to filename without extension if empty
      }));
    }
  };

  // Show notification
  const showNotification = (type, message, isPersistent = false) => {
    setNotification({ type, message, show: true, isPersistent });
    
    if (!isPersistent) {
      // Auto-hide after 5 seconds for non-persistent notifications
      setTimeout(() => {
        setNotification(prev => ({
          ...prev,
          show: prev.message === message && prev.type === type ? false : prev.show
        }));
      }, 5000);
    }
    
    // Return an object with update method for persistent notifications
    return {
      update: (newType, newMessage) => {
        setNotification({
          type: newType,
          message: newMessage,
          show: true,
          isPersistent: false
        });
      }
    };
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for the current field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to get error message for a field
  const getError = (fieldName) => {
    return errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  // Fetch documents and cases on component mount and when filters change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Fetch cases on component mount
  useEffect(() => {
    const fetchCasesData = async () => {
      try {
        const response = await api.get('/cases');
        setCases(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching cases:', err);
        showNotification('error', 'Failed to load cases');
      }
    };
    
    fetchCasesData();
  }, []);

  return (
    <Layout>
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`rounded-md p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          } shadow-lg`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 pl-3">
                <button
                  type="button"
                  className="inline-flex rounded-md focus:outline-none text-gray-600 hover:text-gray-800"
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
              <p className="text-sm text-gray-500">Manage and organize your legal documents</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents by title or description..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={filters.documentType}
                onChange={(e) => setFilters({...filters, documentType: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="case">Case Documents</option>
                <option value="standalone">Standalone Documents</option>
              </select>
              
              <div className="relative flex items-center">
                <select
                  className="block w-full md:w-48 pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={filters.caseId}
                  onChange={(e) => setFilters({...filters, caseId: e.target.value})}
                  disabled={filters.documentType !== 'case'}
                >
                  <option value="all">All Cases</option>
                  {cases.map(caseItem => (
                    <option key={caseItem._id} value={caseItem._id}>
                      {caseItem.caseName || `Case ${caseItem.caseNumber}`}
                    </option>
                  ))}
                </select>
                {filters.documentType === 'case' && filters.caseId !== 'all' && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        confirmDeleteCase(filters.caseId);
                      }}
                      className="text-black hover:text-black focus:outline-none bg-transparent border-none p-1 rounded hover:bg-gray-100"
                      title="Delete this case"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : documents.length === 0 ? (
            <div className="text-center p-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading a new document.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <Upload className="-ml-1 mr-2 h-5 w-5" />
                  Upload Document
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <li 
                  key={doc._id} 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => handleDocumentClick(doc, e)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(doc.fileType || '')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(doc.createdAt) || 'N/A'}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {doc.documentType === 'case' && doc.caseId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {cases.find(c => c._id === doc.caseId)?.caseName || `Case ${doc.caseNumber}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Standalone
                            </span>
                          )}
                          <span className="mx-2">•</span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.fileSize)} • {doc.fileType || 'file'}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        {doc.tags && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {typeof doc.tags === 'string' 
                              ? doc.tags.split(',').map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {tag.trim()}
                                  </span>
                                ))
                              : Array.isArray(doc.tags)
                                ? doc.tags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {typeof tag === 'string' ? tag.trim() : JSON.stringify(tag)}
                                    </span>
                                  ))
                                : null
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleDownload(doc, e)}
                        className="text-blue-400 hover:text-blue-500"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDeleteDocument(doc)}
                        className="text-red-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      {/* Document Details Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isEditing ? 'Edit Document' : 'Document Details'}
                      </h3>
                      <div className="flex space-x-2">
                        {!isEditing && (
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={handleEditClick}
                            title="Edit document"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() => {
                            setViewingDocument(null);
                            setIsEditing(false);
                            setEditingDocument(null);
                          }}
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full">
                      {isEditing ? (
                        <form onSubmit={handleSaveDocument} className="w-full">
                          <div className="mt-4 space-y-4">
                            <div className="mb-4">
                              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
                              <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={editingDocument?.title || ''}
                                onChange={handleEditChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                              />
                            </div>
                            <div className="mb-4">
                              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                name="description"
                                id="description"
                                rows="3"
                                value={editingDocument?.description || ''}
                                onChange={handleEditChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">Document Type</label>
                                <select
                                  name="documentType"
                                  value={editingDocument?.documentType || 'standalone'}
                                  onChange={handleEditChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                >
                                  <option value="standalone">Standalone</option>
                                  <option value="case">Case Document</option>
                                </select>
                              </div>
                            </div>
                            <div className="mb-4">
                              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
                              <input
                                type="text"
                                name="tags"
                                value={Array.isArray(editingDocument?.tags) ? editingDocument.tags.join(', ') : (editingDocument?.tags || '')}
                                onChange={handleTagsChange}
                                placeholder="tag1, tag2, tag3"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                              />
                              <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse space-x-3">
                              <button
                                type="submit"
                                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                disabled={!editingDocument?.title?.trim()} // Disable if title is empty
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </button>
                              <button
                                type="button"
                                className="w-full inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="mt-4 space-y-4">
                          <h4 className="text-lg font-medium text-gray-900">{viewingDocument.title}</h4>
                          {viewingDocument.description && (
                            <p className="mt-1 text-sm text-gray-500">{viewingDocument.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                              <dd className="mt-1 text-sm text-gray-900 capitalize">
                                {viewingDocument.documentType || 'Standalone'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">File Type</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {viewingDocument.fileType || viewingDocument.file?.type || 'N/A'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">File Size</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {formatFileSize(viewingDocument.fileSize || viewingDocument.file?.size)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">File Name</dt>
                              <dd className="mt-1 text-sm text-gray-900 truncate">
                                {viewingDocument.fileName || viewingDocument.file?.name || 'N/A'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {viewingDocument.createdAt 
                                  ? new Date(viewingDocument.createdAt).toLocaleString() 
                                  : 'N/A'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {viewingDocument.updatedAt 
                                  ? new Date(viewingDocument.updatedAt).toLocaleString() 
                                  : 'N/A'}
                              </dd>
                            </div>
                          </div>
                          
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Tags</dt>
                            {viewingDocument.tags && viewingDocument.tags.length > 0 ? (
                              <dd className="mt-1">
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(viewingDocument.tags) 
                                    ? viewingDocument.tags 
                                    : (typeof viewingDocument.tags === 'string' ? viewingDocument.tags.split(',') : [])
                                  )
                                  .filter(tag => tag && tag.trim())
                                  .map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {tag.trim()}
                                    </span>
                                  ))}
                                </div>
                              </dd>
                            ) : (
                              <dd className="mt-1 text-sm text-gray-500">No tags</dd>
                            )}
                          </div>
                          
                          {viewingDocument.caseId && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Related Case</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {cases.find(c => c._id === viewingDocument.caseId)?.title || 'Case not found'}
                              </dd>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
            
            {!isEditing && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    downloadingDocId === viewingDocument._id
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-black hover:bg-gray-800 focus:ring-gray-500'
                  }`}
                  onClick={() => handleDownload(viewingDocument)}
                  disabled={downloadingDocId === viewingDocument._id}
                >
                  {downloadingDocId === viewingDocument._id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setViewingDocument(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingDocId && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Delete Document
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this document? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteDocument}
                    disabled={!deletingDocId}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingDocId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case Delete Confirmation Modal */}
        {showCaseDeleteModal && caseToDelete && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Delete Case and Documents
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this case and all its associated documents? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteCase}
                    disabled={isDeletingCase}
                  >
                    {isDeletingCase ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowCaseDeleteModal(false);
                      setCaseToDelete(null);
                    }}
                    disabled={isDeletingCase}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Upload New Document
                    </h3>
                    <div className="mt-4 space-y-4">
<div>
                        <label htmlFor="documentTitle" className="block text-sm font-medium text-gray-700">
                          Document Title *
                        </label>
                        <input
                          type="text"
                          id="documentTitle"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter document title"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Document Type *
                        </label>
                        <div className="mt-1">
                          <select
                            value={formData.documentType}
                            onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="standalone">Standalone Document</option>
                            <option value="case">Case Document</option>
                          </select>
                        </div>
                      </div>

                      {formData.documentType === 'case' && (
                        <div>
                          <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">
                            Select Case *
                          </label>
                          <select
                            id="caseId"
                            value={formData.caseId}
                            onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            disabled={loadingCases}
                          >
                            <option value="">Select a case</option>
                            {cases.map((caseItem) => (
                              <option key={caseItem._id} value={caseItem._id}>
                                {caseItem.caseName || `Case ${caseItem.caseNumber}`}
                              </option>
                            ))}
                          </select>
                          {errors.caseId && <p className="mt-1 text-sm text-red-600">{errors.caseId}</p>}
                        </div>
                      )}

                      <div>
                        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                          Upload File *
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setFormData(prev => ({
                                        ...prev,
                                        file,
                                        name: prev.name || file.name.split('.').slice(0, -1).join('.')
                                      }));
                                    }
                                  }}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG up to 10MB
                            </p>
                            {formData.file && (
                              <p className="text-sm text-gray-900 mt-2">
                                Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                            {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="description"
                            rows={3}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Add a description (optional)"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                          Tags
                        </label>
                        <input
                          type="text"
                          id="tags"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formData.tags}
                          onChange={(e) => setFormData({...formData, tags: e.target.value})}
                          placeholder="e.g. contract, agreement, 2023 (comma separated)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleFileUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowUploadModal(false);
                    setErrors({});
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal is now the single source of truth for viewing documents */}
    </Layout>
  );
};

export default Documents;
