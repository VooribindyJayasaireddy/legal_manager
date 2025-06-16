import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Define types for Draft data
interface Draft {
    _id: string;
    user: { _id: string; firstName?: string; lastName?: string; username: string };
    title: string;
    content: string;
    draftType?: string;
    case?: { _id: string; caseName: string; caseNumber?: string };
    client?: { _id: string; firstName: string; lastName: string };
    status: 'in_progress' | 'under_review' | 'finalized' | 'archived';
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface DraftListPageProps {
    onAddDraftClick: () => void;
    onViewDraft: (draftId: string) => void;
    onEditDraft: (draftId: string) => void;
    onDeleteDraft: (draftId: string) => void;
    onLogout: () => void;
}

const DraftList: React.FC<DraftListPageProps> = ({
    onAddDraftClick,
    onViewDraft,
    onEditDraft,
    onDeleteDraft,
    onLogout,
}) => {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDrafts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const response = await fetch('http://localhost:5000/api/drafts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDrafts(data);
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch drafts');
            }
        } catch (err) {
            console.error('Error fetching drafts:', err);
            setError('Failed to connect to the server');
        } finally {
            setIsLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const filteredDrafts = drafts.filter(draft =>
        draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (draft.case?.caseName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Loading drafts...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600 bg-red-100 rounded">
                {error}
                <button 
                    onClick={onLogout} 
                    className="block mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Log Out
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Drafts</h1>
                <button
                    onClick={onAddDraftClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    + New Draft
                </button>
            </div>
            
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search drafts..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {filteredDrafts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No drafts found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredDrafts.map((draft) => (
                        <div 
                            key={draft._id} 
                            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onViewDraft(draft._id)}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium text-gray-900">{draft.title}</h3>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditDraft(draft._id);
                                        }}
                                        className="text-gray-400 hover:text-blue-600 p-1"
                                        title="Edit"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteDraft(draft._id);
                                        }}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                        title="Delete"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 22H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {draft.case?.caseName && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Case: {draft.case.caseName}
                                </p>
                            )}
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {draft.content}
                            </p>
                            <div className="mt-3 flex items-center text-xs text-gray-400">
                                <span>Last updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                                <span className="mx-2">•</span>
                                <span>{draft.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DraftList;
