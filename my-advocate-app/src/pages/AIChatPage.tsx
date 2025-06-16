import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Type definitions for chat messages
interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    // Optional fields for actions triggered by AI
    action?: 'draft_saved' | 'extracted_data';
    actionPayload?: {
        draftId?: string;
        draftTitle?: string;    
        extractedData?: Record<string, any>; // More specific for JSON object
    };
}

// Type guards
function isDraftSavedMessage(msg: ChatMessage): msg is ChatMessage & {
    action: 'draft_saved';
    actionPayload: { draftId: string; draftTitle?: string };
} {
    return msg.action === 'draft_saved' && !!msg.actionPayload?.draftId;
}

function isExtractedDataMessage(msg: ChatMessage): msg is ChatMessage & {
    action: 'extracted_data';
    actionPayload: { extractedData: any };
} {
    return msg.action === 'extracted_data' && !!msg.actionPayload?.extractedData;
}

type Message = {
  role: 'user' | 'assistant';
  text: string;
  action?: 'draft_saved' | 'extracted_data';
  actionPayload?: {
    draftId?: string;
    draftTitle?: string;
    extractedData?: any;
  };
}

// Client/Case Option for context selection
interface AssociationOption {
    _id: string;
    name: string;
    detail: string;
}

interface DocumentOption {
    _id: string;
    title: string;
    content: string;
}

interface AIChatPageProps {
    onLogout: () => void;
}

const AIChatPage: React.FC<AIChatPageProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isContextLoading, setIsContextLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [shareEmail, setShareEmail] = useState<string>('');
    const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
    const [shareMessage, setShareMessage] = useState<{text: string; type: 'success' | 'error' | ''}>({text: '', type: ''});

    // Handle document sharing
    const handleShareDocument = async () => {
        if (!selectedDocumentId) {
            setShareMessage({text: 'Please select a document first', type: 'error'});
            return;
        }
        
        if (!shareEmail) {
            setShareMessage({text: 'Please enter an email address', type: 'error'});
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Authentication required. Please log in.');
            onLogout();
            return;
        }

        try {
            setShareMessage({text: 'Sharing document...', type: ''});
            
            const response = await fetch('http://localhost:5000/api/documents/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    documentId: selectedDocumentId,
                    email: shareEmail,
                    permission: sharePermission
                })
            });

            const data = await response.json();
            if (response.ok) {
                setShareMessage({
                    text: `Document shared successfully with ${shareEmail} (${sharePermission} access)`,
                    type: 'success'
                });
                setShareEmail('');
                // Hide the message after 5 seconds
                setTimeout(() => setShareMessage({text: '', type: ''}), 5000);
            } else {
                throw new Error(data.message || 'Failed to share document');
            }
        } catch (error) {
            console.error('Error sharing document:', error);
            setShareMessage({
                text: error instanceof Error ? error.message : 'Failed to share document',
                type: 'error'
            });
        }
    };

    // States for contextual data selection
    const [availableClients, setAvailableClients] = useState<AssociationOption[]>([]);
    const [availableCases, setAvailableCaseOptions] = useState<AssociationOption[]>([]);
    const [availableDocuments, setAvailableDocuments] = useState<DocumentOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
    const [documentContent, setDocumentContent] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Fetch available clients and cases for context selection
    const fetchAssociations = useCallback(async () => {
        setIsContextLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in.');
                onLogout();
                setIsContextLoading(false);
                return;
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json();
                setAvailableClients(clientsData.map((c: any) => ({
                    _id: c._id,
                    name: `${c.firstName} ${c.lastName}`,
                    detail: c.email
                })));
            } else { 
                console.error('Failed to fetch clients:', clientsResponse.status); 
                setError('Failed to load clients.');
            }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (casesResponse.ok) {
                const casesData = await casesResponse.json();
                setAvailableCaseOptions(casesData.map((c: any) => ({
                    _id: c._id,
                    name: c.caseName,
                    detail: c.caseNumber
                })));
            } else { 
                console.error('Failed to fetch cases:', casesResponse.status); 
                setError('Failed to load cases.');
            }

            // Fetch Documents
            console.log('Fetching documents...');
            try {
                const docsResponse = await fetch('http://localhost:5000/api/documents', { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });
                
                console.log('Documents response status:', docsResponse.status);
                const responseText = await docsResponse.text();
                console.log('Raw documents response:', responseText);
                
                if (!docsResponse.ok) {
                    throw new Error(`HTTP error! status: ${docsResponse.status} - ${responseText}`);
                }
                
                let docsData;
                try {
                    docsData = JSON.parse(responseText);
                } catch (e) {
                    throw new Error(`Failed to parse JSON: ${responseText}`);
                }
                
                console.log('Parsed documents data:', docsData);
                
                // Handle different response formats
                let documents = [];
                if (Array.isArray(docsData)) {
                    documents = docsData;
                } else if (docsData && Array.isArray(docsData.documents)) {
                    documents = docsData.documents;
                } else if (docsData && docsData.data) {
                    documents = Array.isArray(docsData.data) ? docsData.data : [docsData.data];
                } else {
                    documents = [docsData];
                }
                
                console.log('Extracted documents:', documents);
                
                const formattedDocs = documents
                    .filter((doc: any) => doc && (doc._id || doc.id)) // Filter out invalid documents
                    .map((doc: any) => ({
                        _id: doc._id || doc.id,
                        title: doc.title || doc.name || 'Untitled Document',
                        content: doc.content || doc.text || doc.body || ''
                    }));
                
                console.log('Formatted documents:', formattedDocs);
                setAvailableDocuments(formattedDocs);
                
                // If there are documents, select the first one by default
                if (formattedDocs.length > 0) {
                    console.log('Setting first document as selected');
                    setSelectedDocumentId(formattedDocs[0]._id);
                    setDocumentContent(formattedDocs[0].content || 'No content available');
                } else {
                    console.log('No documents found');
                    setError('No documents found. Please upload documents first.');
                }
                
            } catch (err) {
                const errorMessage = `Error loading documents: ${(err as Error).message}`;
                console.error(errorMessage, err);
                setError(errorMessage);
            }

        } catch (err) {
            console.error('Network error fetching associations:', err);
            setError('Network error while loading context data.');
        } finally {
            setIsContextLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchAssociations();
    }, [fetchAssociations]);

    const handleSubmitMessage = async (messageText: string) => {
        if (!messageText.trim() || isSending) return;

        const newUserMessage: ChatMessage = { role: 'user', text: messageText };
        setChatHistory(prev => [...prev, newUserMessage]);
        setCurrentMessage('');
        setIsSending(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication required. Please log in.');
                onLogout();
                return;
            }

            // Prepare context data to send to backend
            const contextData: any = {};
            if (selectedClientId) contextData.clientId = selectedClientId;
            if (selectedCaseId) contextData.caseId = selectedCaseId;
            
            // Get the full document data if a document is selected
            let documentToSend = null;
            if (selectedDocumentId) {
                const selectedDoc = availableDocuments.find(doc => doc._id === selectedDocumentId);
                if (selectedDoc) {
                    documentToSend = {
                        _id: selectedDoc._id,
                        title: selectedDoc.title,
                        content: selectedDoc.content
                    };
                    contextData.document = documentToSend;
                }
            }

            let responseData: any;
            let apiEndpoint = '/api/ai/chat'; // Default to general chat

            // --- Intent Detection (Simple keyword-based) ---
            const lowerCaseMessage = messageText.toLowerCase();

            if (lowerCaseMessage.includes('draft a') || lowerCaseMessage.includes('write a letter') || lowerCaseMessage.includes('generate a ')) {
                // Intent: Drafting
                apiEndpoint = '/api/ai/draft';
                const draftTitleMatch = messageText.match(/(draft a|write a|generate a)\s*(.*)/i);
                const draftTitle = draftTitleMatch && draftTitleMatch[2] ? draftTitleMatch[2].trim() : 'Generated Draft';
                const draftTypeMatch = lowerCaseMessage.match(/(letter|contract clause|memo|affidavit|email response)/i);
                const draftType = draftTypeMatch ? draftTypeMatch[0].replace(' ', '_') : 'general_document';

                const draftRequestBody = {
                    title: draftTitle.charAt(0).toUpperCase() + draftTitle.slice(1),
                    draftType: draftType,
                    prompt: messageText,
                    ...contextData,
                };

                const draftResponse = await fetch(`http://localhost:5000${apiEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(draftRequestBody),
                });
                responseData = await draftResponse.json();

                if (draftResponse.ok) {
                    setChatHistory(prev => [...prev, {
                        role: 'model',
                        text: `I've generated a draft for you: "${responseData.draft.title}". You can view it by clicking the link below.`,
                        action: 'draft_saved',
                        actionPayload: { draftId: responseData.draft._id, draftTitle: responseData.draft.title }
                    }]);
                } else {
                    throw new Error(responseData.message || 'Failed to generate and save draft.');
                }

            } else if (lowerCaseMessage.includes('extract data') || lowerCaseMessage.includes('find information') || lowerCaseMessage.includes('parse this')) {
                // Handle document analysis
                if (!selectedDocumentId) {
                    setChatHistory(prev => [...prev, { 
                        role: 'model', 
                        text: 'Please select a document to analyze.' 
                    }]);
                    setIsSending(false);
                    return;
                }
                
                try {
                    const selectedDoc = availableDocuments.find(doc => doc._id === selectedDocumentId);
                    if (!selectedDoc) {
                        throw new Error('Selected document not found');
                    }
                    
                    // Send document for analysis
                    const analysisResponse = await fetch('http://localhost:5000/api/ai/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            documentId: selectedDoc._id,
                            documentContent: selectedDoc.content,
                            query: messageText,
                            contextData
                        })
                    });
                    
                    const analysisData = await analysisResponse.json();
                    
                    if (analysisResponse.ok) {
                        setChatHistory(prev => [...prev, { 
                            role: 'model', 
                            text: analysisData.analysis || 'Here\'s what I found in the document:'
                        }]);
                    } else {
                        throw new Error(analysisData.message || 'Failed to analyze document');
                    }
                } catch (err) {
                    console.error('Document analysis error:', err);
                    setChatHistory(prev => [...prev, { 
                        role: 'model', 
                        text: `Error analyzing document: ${(err as Error).message}. Please try again.` 
                    }]);
                } finally {
                    setIsSending(false);
                }
                return;
            } else {
                // Default: General Chat
                const chatRequestBody = {
                    message: messageText,
                    chatHistory: chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
                    contextData,
                };

                const chatResponse = await fetch(`http://localhost:5000${apiEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(chatRequestBody),
                });
                responseData = await chatResponse.json();

                if (chatResponse.ok) {
                    setChatHistory(prev => [...prev, { role: 'model', text: responseData.response }]);
                } else {
                    throw new Error(responseData.message || 'Failed to get AI response.');
                }
            }

        } catch (err) {
            console.error('API call error:', err);
            const errorMessage = `Error: ${(err as Error).message}. Please try again.`;
            setError(errorMessage);
            setChatHistory(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-inter">
            <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">AI Chat Assistant</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-150"
                >
                    Back to Dashboard
                </button>
            </header>

            <div className="flex-1 overflow-hidden p-6 flex flex-col">
                <div className="flex-1 overflow-y-auto bg-white p-4 rounded-lg shadow-md mb-4 border border-gray-200">
                    {chatHistory.length === 0 && (
                        <p className="text-gray-500 text-center py-10">Start a conversation with your Legal AI Assistant!</p>
                    )}
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg shadow ${
                                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                            }`}>
                                <p className="font-semibold text-sm">{msg.role === 'user' ? 'You' : 'AI Assistant'}</p>
                                <p className="text-base whitespace-pre-wrap">{msg.text}</p>
                                {isDraftSavedMessage(msg) && (
                                    <button
                                        onClick={() => navigate(`/drafts/${msg.actionPayload.draftId}`)}
                                        className="mt-2 text-blue-200 hover:text-blue-50 text-sm font-medium underline"
                                    >
                                        View Draft: {msg.actionPayload.draftTitle || 'Click to view'}
                                    </button>   
                                )}
                            </div>
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex justify-start mb-4">
                            <div className="max-w-xl p-3 rounded-lg bg-gray-200 text-gray-800 shadow">
                                <p className="font-semibold text-sm">AI Assistant</p>
                                <p className="text-base">Typing...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    {error && (
                        <div className="p-2 mb-3 bg-red-100 text-red-700 rounded-lg text-sm" role="alert">
                            {error}
                        </div>
                    )}
                    
                    {isContextLoading ? (
                        <div className="text-center text-gray-500 py-2">Loading context data...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="selectClient" className="block text-gray-700 text-xs font-bold mb-1">Contextual Client:</label>
                                    <select
                                        id="selectClient"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Select Client (Optional) --</option>
                                        {availableClients.map(client => (
                                            <option key={client._id} value={client._id}>
                                                {client.name} ({client.detail})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="selectCase" className="block text-gray-700 text-xs font-bold mb-1">Contextual Case:</label>
                                    <select
                                        id="selectCase"
                                        value={selectedCaseId}
                                        onChange={(e) => setSelectedCaseId(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Select Case (Optional) --</option>
                                        {availableCases.map(caseItem => (
                                            <option key={caseItem._id} value={caseItem._id}>
                                                {caseItem.name} ({caseItem.detail})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="selectDocument" className="block text-gray-700 text-xs font-bold">
                                            Select Document:
                                        </label>
                                        <span className="text-xs text-gray-500">
                                            {availableDocuments.length} document{availableDocuments.length !== 1 ? 's' : ''} available
                                        </span>
                                    </div>
                                    
                                    {availableDocuments.length > 0 ? (
                                        <>
                                            <select
                                                id="selectDocument"
                                                value={selectedDocumentId || ''}
                                                onChange={(e) => {
                                                    const docId = e.target.value;
                                                    console.log('Selected document ID:', docId);
                                                    setSelectedDocumentId(docId);
                                                    const selectedDoc = availableDocuments.find(doc => doc._id === docId);
                                                    console.log('Selected document:', selectedDoc);
                                                    setDocumentContent(selectedDoc?.content || 'No content available');
                                                }}
                                                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="" disabled>-- Select a document --</option>
                                                {availableDocuments.map(doc => (
                                                    <option key={doc._id} value={doc._id}>
                                                        {doc.title || `Document ${doc._id.substring(0, 6)}`}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedDocumentId && (
                                                <div className="flex space-x-2 mt-1">
                                                    <button
                                                        onClick={() => {
                                                            const selectedDoc = availableDocuments.find(doc => doc._id === selectedDocumentId);
                                                            if (selectedDoc) {
                                                                console.log('Document content:', selectedDoc.content);
                                                                // Force update the content display
                                                                setDocumentContent(selectedDoc.content || 'No content available');
                                                            }
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        Refresh
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsSharing(!isSharing);
                                                            setShareMessage({text: '', type: ''});
                                                        }}
                                                        className="text-xs text-green-600 hover:text-green-800"
                                                    >
                                                        {isSharing ? 'Cancel Share' : 'Share'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                                            No documents found. Please upload documents first.
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className={`mb-4 transition-all duration-200 ${selectedDocumentId ? 'opacity-100' : 'opacity-70'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-gray-700 text-xs font-bold">
                                        Document Content:
                                    </label>
                                    <span className="text-xs text-gray-500">
                                        {selectedDocumentId 
                                            ? (availableDocuments.find(d => d._id === selectedDocumentId)?.title || 'Selected Document')
                                            : 'No document selected'}
                                    </span>
                                </div>
                                
                                <div className={`p-3 bg-gray-50 rounded-md border ${
                                    selectedDocumentId ? 'border-gray-300' : 'border-dashed border-gray-300 bg-gray-100'
                                } text-sm text-gray-600 overflow-auto max-h-60 whitespace-pre-wrap font-mono text-xs`}>
                                    {selectedDocumentId ? (
                                        documentContent ? (
                                            documentContent.length > 1000 ? (
                                                <>
                                                    <div className="mb-2 text-xs text-gray-500">
                                                        Showing first 1000 characters. Click 'View Full' to see complete content.
                                                    </div>
                                                    {documentContent.substring(0, 1000)}...
                                                    <button 
                                                        onClick={() => {
                                                            const selectedDoc = availableDocuments.find(d => d._id === selectedDocumentId);
                                                            if (selectedDoc) {
                                                                alert(selectedDoc.content || 'No content available');
                                                            }
                                                        }}
                                                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        View Full Content
                                                    </button>
                                                </>
                                            ) : (
                                                documentContent
                                            )
                                        ) : (
                                            <span className="text-gray-400">No content available for this document</span>
                                        )
                                    ) : (
                                        <div className="text-center py-4 text-gray-400">
                                            Select a document to view its content
                                        </div>
                                    )}
                                </div>
                                
                                {selectedDocumentId && (
                                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                                        <span>
                                            {documentContent ? 
                                                `${documentContent.length.toLocaleString()} characters` : 
                                                'No content'}
                                        </span>
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => {
                                                    const selectedDoc = availableDocuments.find(d => d._id === selectedDocumentId);
                                                    if (selectedDoc) {
                                                        navigator.clipboard.writeText(selectedDoc.content || '');
                                                        // You might want to show a toast notification here
                                                        alert('Document content copied to clipboard!');
                                                    }
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Copy Content
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {isSharing && selectedDocumentId && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-800 mb-3">Share Document</h4>
                                    {shareMessage.text && (
                                        <div
                                            className={
                                                shareMessage.type === 'error' 
                                                    ? 'mb-3 p-2 rounded text-sm bg-red-100 text-red-700'
                                                    : shareMessage.type === 'success' 
                                                        ? 'mb-3 p-2 rounded text-sm bg-green-100 text-green-700'
                                                        : 'mb-3 p-2 rounded text-sm bg-blue-100 text-blue-700'
                                            }
                                        >
                                            {shareMessage.text}
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="shareEmail" className="block text-xs font-medium text-gray-700 mb-1">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="shareEmail"
                                                value={shareEmail}
                                                onChange={(e) => setShareEmail(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Permission Level
                                            </label>
                                            <div className="flex space-x-4">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        checked={sharePermission === 'view'}
                                                        onChange={() => setSharePermission('view')}
                                                    />
                                                    <span className="ml-1 text-gray-700">View Only</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        checked={sharePermission === 'edit'}
                                                        onChange={() => setSharePermission('edit')}
                                                    />
                                                    <span className="ml-1 text-gray-700">Can Edit</span>
                                                </label>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleShareDocument}
                                            disabled={!shareEmail || shareMessage.type === 'success'}
                                            className="w-full px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Share Document
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex space-x-3 mt-4">
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmitMessage(currentMessage);
                                        }
                                    }}
                                    placeholder="Ask your legal AI assistant..."
                                    className="flex-1 border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSending}
                                />
                                <button
                                    onClick={() => handleSubmitMessage(currentMessage)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSending}
                                >
                                    {isSending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;