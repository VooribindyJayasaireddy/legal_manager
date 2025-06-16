import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Define types for Draft data
interface Draft {
    _id: string;
    user: { _id: string; firstName?: string; lastName?: string; username: string }; // Populated User info
    title: string;
    content: string;
    draftType?: string;
    case?: { _id: string; caseName: string; caseNumber?: string }; // Populated Case info
    client?: { _id: string; firstName: string; lastName: string; email?: string; phone?: string; }; // Populated Client info
    status: 'in_progress' | 'under_review' | 'finalized' | 'archived';
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface DraftDetailsPageProps {
    onBackToList: () => void;
    onEditDraft: (draftId: string) => void;
    onLogout: () => void;
}

const DraftDetailsPage: React.FC<DraftDetailsPageProps> = ({ onBackToList, onEditDraft, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get draft ID from URL
    const navigate = useNavigate();
    const [draftDetails, setDraftDetails] = useState<Draft | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDraftDetails = useCallback(async () => {
        if (!id) {
            setError('Draft ID not provided in URL.');
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

            const apiUrl = `http://localhost:5000/api/drafts/${id}`; // Your backend endpoint to get a single draft
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: Draft = await response.json();
                setDraftDetails(data);
            } else if (response.status === 404) {
                setError('Draft not found.');
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch draft details.');
                console.error('Failed to fetch draft details:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching draft details:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchDraftDetails();
    }, [fetchDraftDetails]);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    const getStatusBadgeClass = (status: 'in_progress' | 'under_review' | 'finalized' | 'archived') => {
        switch (status) {
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'under_review': return 'bg-yellow-100 text-yellow-800';
            case 'finalized': return 'bg-green-100 text-green-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading draft details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {error}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Draft List
                    </button>
                </div>
            </div>
        );
    }

    if (!draftDetails) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-gray-700 mb-4">Draft data not available.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Draft List</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Draft Details</h1>
                    <button
                        onClick={onBackToList}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-150"
                    >
                        Back to List
                    </button>
                </div>

                {/* Draft Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{draftDetails.title}</h2>
                        {draftDetails.draftType && <p className="text-gray-600 text-lg">{draftDetails.draftType}</p>}
                    </div>
                    {draftDetails.status && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(draftDetails.status)}`}>
                            {draftDetails.status.replace('_', ' ').charAt(0).toUpperCase() + draftDetails.status.replace('_', ' ').slice(1)}
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button onClick={() => onEditDraft(draftDetails._id)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-150">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edit Draft
                    </button>
                    {/* Placeholder for other actions like Download, Print, etc. */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Associations Column */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Associations</h3>
                        <div className="space-y-3 text-gray-700">
                            {draftDetails.client ? (
                                <p className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                                    <strong>Client:</strong> {draftDetails.client.firstName} {draftDetails.client.lastName} ({draftDetails.client.email})
                                </p>
                            ) : (
                                <p><strong>Client:</strong> N/A</p>
                            )}
                            {draftDetails.case ? (
                                <p className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                                    <strong>Case:</strong> {draftDetails.case.caseName} ({draftDetails.case.caseNumber})
                                </p>
                            ) : (
                                <p><strong>Case:</strong> N/A</p>
                            )}
                        </div>
                    </div>

                    {/* Metadata Column */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Metadata</h3>
                        <div className="space-y-3 text-gray-700">
                            <p><strong>Created By:</strong> {draftDetails.user?.firstName || draftDetails.user?.username || 'N/A'}</p>
                            {draftDetails.tags && draftDetails.tags.length > 0 && (
                                <p><strong>Tags:</strong> {draftDetails.tags.join(', ')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Draft Content */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Draft Content</h3>
                    <pre className="whitespace-pre-wrap font-mono text-gray-700 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {draftDetails.content}
                    </pre>
                    <button
                        onClick={() => navigator.clipboard.writeText(draftDetails.content)}
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                    >
                        Copy Content
                    </button>
                </div>

                {/* Created/Updated Info */}
                <div className="text-right text-gray-500 text-sm mt-8 flex justify-between items-center">
                    <div>
                        <p>Last updated: {formatDate(draftDetails.updatedAt)}</p>
                        <p>Created: {formatDate(draftDetails.createdAt)}</p>
                    </div>
                    <button
                        onClick={() => onEditDraft(draftDetails._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150"
                    >
                        Edit Draft
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DraftDetailsPage;
