    import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Define types for Client data
interface Client {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    dateOfBirth?: string;
    occupation?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface ClientDetailsPageProps {
    onBackToList: () => void;
    onEditClient: (clientId: string) => void;
    onLogout: () => void;
}

const ClientDetailsPage: React.FC<ClientDetailsPageProps> = ({ onBackToList, onEditClient, onLogout }) => {
    const { id } = useParams<{ id: string }>();
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    const fetchClientDetails = useCallback(async () => {
        if (!id) {
            setError('Client ID not provided in URL.');
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

            const apiUrl = `http://localhost:5000/api/clients/${id}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: Client = await response.json();
                setClient(data);
            } else if (response.status === 404) {
                setError('Client not found.');
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch client details.');
                console.error('Failed to fetch client details:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching client details:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading client details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {error}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Client List
                    </button>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-gray-700 mb-4">Client data not available.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Client List</button>
                </div>
            </div>
        );
    }

    const handleDelete = async () => {
        if (!id) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const response = await fetch(`http://localhost:5000/api/clients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                onBackToList();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete client');
            }
        } catch (err) {
            console.error('Error deleting client:', err);
            setError('Failed to delete client. Please try again.');
        }
        setShowDeleteConfirm(false);
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const formatDateShort = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-inter">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Client Management</h1>
                    <div className="relative w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search clients..."
                        />
                    </div>
                </div>

                {/* Breadcrumbs */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        <li>
                            <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Clients</a>
                        </li>
                        <li>
                            <span className="text-gray-400 mx-2">/</span>
                        </li>
                        <li>
                            <span className="text-gray-700 font-medium text-sm">Client Details</span>
                        </li>
                    </ol>
                </nav>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-3">
                        <button
                            onClick={() => onEditClient(client._id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>

                {/* Client Details Card */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Client Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-semibold text-blue-600">
                                    {getInitials(client.firstName, client.lastName)}
                                </div>
                            </div>
                            <div className="ml-6 flex-grow">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        {client.firstName} {client.lastName}
                                    </h2>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                            </svg>
                                        </button>
                                        {showDeleteConfirm && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                                <button
                                                    onClick={handleDelete}
                                                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                                                >
                                                    Delete Client
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    {client.email || 'No email provided'}
                                </div>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    {client.phone || 'No phone number'}
                                </div>
                            </div>
                            <div className="ml-6 border-l border-gray-200 pl-6">
                                <div className="text-sm text-gray-500">Date of Birth</div>
                                <div className="mt-1 text-sm font-medium text-gray-900">
                                    {client.dateOfBirth ? formatDateShort(client.dateOfBirth) : 'N/A'}
                                </div>
                            </div>
                            <div className="ml-6 border-l border-gray-200 pl-6">
                                <div className="text-sm text-gray-500">Occupation</div>
                                <div className="mt-1 text-sm font-medium text-gray-900">
                                    {client.occupation || 'N/A'}
                                </div>
                            </div>
                            <div className="ml-6 border-l border-gray-200 pl-6">
                                <div className="text-sm text-gray-500">Created Date</div>
                                <div className="mt-1 text-sm font-medium text-gray-900">
                                    {formatDateShort(client.createdAt)}
                                </div>
                            </div>
                            <div className="ml-6 border-l border-gray-200 pl-6">
                                <div className="text-sm text-gray-500">Last Updated</div>
                                <div className="mt-1 text-sm font-medium text-gray-900">
                                    {formatDateShort(client.updatedAt)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Address</p>
                                {client.address ? (
                                    <div className="mt-1 text-sm text-gray-700">
                                        <p>{client.address.street || 'N/A'}</p>
                                        <p>{[client.address.city, client.address.state, client.address.zipCode].filter(Boolean).join(', ')}</p>
                                        <p>{client.address.country}</p>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-700">No address provided</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Details Section */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Notes</p>
                                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                                    {client.notes || 'No notes available'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-8 flex justify-between items-center text-sm text-gray-500">
                    <div>© 2024 Client Management System. All rights reserved.</div>
                    <div>Last synced: {new Date().toLocaleTimeString()}</div>
                </footer>
            </div>
        </div>
    );
};

export default ClientDetailsPage;
