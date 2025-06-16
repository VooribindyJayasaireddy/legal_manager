import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate

// Define types for Client data
interface Client {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}

// Define types for Case data
interface Case {
    _id: string;
    user: string; // User ID
    caseName: string;
    caseNumber?: string;
    description?: string;
    clients: (string | Client)[]; // Can be array of IDs or populated client objects
    status: 'open' | 'pending' | 'closed' | 'on_hold';
    caseType?: string;
    startDate?: string;
    endDate?: string;
    court?: string;
    jurisdiction?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Define Client type for displaying client information when populating case details
interface ClientDisplayInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    // Add other relevant client fields if needed for display
}

interface CaseDetailsPageProps {
    onBackToList: () => void;
    onEditCase: (caseId: string) => void;
    onLogout: () => void;
}

const CaseDetailsPage: React.FC<CaseDetailsPageProps> = ({ onBackToList, onEditCase, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get case ID from URL
    const navigate = useNavigate(); // Initialize navigate hook
    const [caseDetails, setCaseDetails] = useState<Case | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [caseClients, setCaseClients] = useState<ClientDisplayInfo[]>([]); // To store actual client data for display

    const fetchCaseDetails = useCallback(async () => {
        if (!id) {
            setError('Case ID not provided in URL.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            // Fetch case details
            const caseApiUrl = `http://localhost:5000/api/cases/${id}`;
            const caseResponse = await fetch(caseApiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!caseResponse.ok) {
                if (caseResponse.status === 404) {
                    setError('Case not found.');
                } else if (caseResponse.status === 401 || caseResponse.status === 403) {
                    setError('Session expired or unauthorized. Please log in again.');
                    onLogout();
                } else {
                    const errorData = await caseResponse.json();
                    setError(errorData.message || 'Failed to fetch case details.');
                }
                console.error('Failed to fetch case details:', caseResponse.status);
                setIsLoading(false);
                return;
            }

            const caseData: Case = await caseResponse.json();
            setCaseDetails(caseData);

            // The case data from the backend should already have the clients populated
            // due to the .populate('clients') in the backend controller
            if (caseData.clients && Array.isArray(caseData.clients)) {
                // Filter out any string IDs and map the remaining client objects
                const clients = caseData.clients
                    .filter((client): client is Client => typeof client !== 'string')
                    .map(client => ({
                        _id: client._id,
                        firstName: client.firstName,
                        lastName: client.lastName,
                        email: client.email,
                        phone: client.phone
                    }));
                setCaseClients(clients);
                
                if (clients.length === 0 && caseData.clients.length > 0) {
                    console.warn('No valid client data found in the case clients array.');
                }
            } else {
                console.warn('No clients array found in case data or it is not an array.');
                setCaseClients([]);
            }


        } catch (err) {
            console.error('Network or unexpected error fetching case details:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchCaseDetails();
    }, [fetchCaseDetails]);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return dateString;
        }
    };

    const handleAddDocumentClick = () => {
        if (caseDetails) {
            // Navigate to add document page, passing caseId in state
            navigate('/documents/add', { state: { preselectCaseId: caseDetails._id, preselectCaseName: caseDetails.caseName, preselectCaseNumber: caseDetails.caseNumber } });
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading case details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {error}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Case List
                    </button>
                </div>
            </div>
        );
    }

    if (!caseDetails) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-gray-700 mb-4">Case data not available.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Case List</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <button
                            onClick={onBackToList}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Cases
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {caseDetails.caseName}
                        </h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleAddDocumentClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Document
                        </button>
                        <button
                            onClick={() => onEditCase(caseDetails._id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Case
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Case Information
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Case details and related information
                        </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Case Name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {caseDetails.caseName || 'N/A'}
                                </dd>
                            </div>
                            {caseDetails.caseNumber && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Case Number</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {caseDetails.caseNumber}
                                    </dd>
                                </div>
                            )}
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        caseDetails.status === 'open' ? 'bg-green-100 text-green-800' :
                                        caseDetails.status === 'closed' ? 'bg-red-100 text-red-800' :
                                        caseDetails.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {caseDetails.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </span>
                                </dd>
                            </div>
                            {caseDetails.caseType && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Case Type</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {caseDetails.caseType}
                                    </dd>
                                </div>
                            )}
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatDate(caseDetails.startDate) || 'N/A'}
                                </dd>
                            </div>
                            {caseDetails.endDate && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {formatDate(caseDetails.endDate)}
                                    </dd>
                                </div>
                            )}
                            {caseDetails.court && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Court</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {caseDetails.court}
                                    </dd>
                                </div>
                            )}
                            {caseDetails.jurisdiction && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {caseDetails.jurisdiction}
                                    </dd>
                                </div>
                            )}
                            {caseDetails.description && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                                        {caseDetails.description}
                                    </dd>
                                </div>
                            )}
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatDate(caseDetails.createdAt) || 'N/A'}
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {formatDate(caseDetails.updatedAt) || 'N/A'}
                                </dd>
                            </div>
                            {caseDetails.notes && (
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                                        {caseDetails.notes}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {caseClients.length > 0 && (
                    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 bg-gray-50">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Associated Clients
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Clients involved in this case
                            </p>
                        </div>
                        <div className="border-t border-gray-200">
                            <ul className="divide-y divide-gray-200">
                                {caseClients.map((client) => (
                                    <li key={client._id} className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                                {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {client.firstName} {client.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {client.email || client.phone || 'No contact information'}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default CaseDetailsPage;
