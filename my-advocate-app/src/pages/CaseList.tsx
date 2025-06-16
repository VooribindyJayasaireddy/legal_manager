import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Define types for Case data based on your schema
interface Case {
    _id: string;
    user: string; // User ID
    caseName: string;
    caseNumber?: string;
    description?: string;
    clients: string[]; // Array of Client IDs (for now, just IDs)
    status: 'open' | 'pending' | 'closed' | 'on_hold';
    caseType?: string;
    startDate?: string;
    endDate?: string;
    court?: string;
    jurisdiction?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    // Add any other fields that might be needed for display
    clientDetails?: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    }>;
}

interface CaseListPageProps {
    onAddCaseClick: () => void;
    onViewCase: (caseId: string) => void;
    onEditCase: (caseId: string) => void;
    onDeleteCase: (caseId: string) => void;
    onLogout: () => void;
    showFullPage?: boolean;
}

const CaseList: React.FC<CaseListPageProps> = ({
    onAddCaseClick,
    onViewCase,
    onEditCase,
    onDeleteCase,
    onLogout,
    showFullPage = false,
}) => {
    const navigate = useNavigate();
    const [cases, setCases] = useState<Case[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<string>('All Cases');
    const [sortBy, setSortBy] = useState<string>('Recent Updates');
    const [isCasesLoading, setIsCasesLoading] = useState<boolean>(true);
    const [casesError, setCasesError] = useState<string | null>(null);
    const [isCasesMenuOpen, setIsCasesMenuOpen] = useState<boolean>(true);

    const fetchCases = useCallback(async () => {
        setIsCasesLoading(true);
        setCasesError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                onLogout();
                return;
            }

            const response = await fetch('http://localhost:5000/api/cases', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch cases');
            }

            const data = await response.json();
            setCases(data);
        } catch (err) {
            setCasesError(err instanceof Error ? err.message : 'An error occurred while fetching cases');
        } finally {
            setIsCasesLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const filteredAndSortedCases = cases
        .filter(caseItem => 
            caseItem.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            caseItem.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            caseItem.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const renderSidebar = () => (
        <aside className="w-64 bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">LegalEase</h2>
            <nav>
                <ul>
                    <li className="mb-2">
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} 
                            className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition duration-150"
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                            </svg>
                            Dashboard
                        </a>
                    </li>
                    <li className="mb-2">
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate('/clients'); }} 
                            className="flex items-center text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition duration-150"
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM1 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H3a2 2 0 01-2-2v-2zm6 4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2zm6-4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                            </svg>
                            Clients
                        </a>
                    </li>
                    <li className="mb-2">
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate('/cases'); }} 
                            className="flex items-center bg-blue-50 text-blue-600 font-semibold p-2 rounded-lg"
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                            </svg>
                            Cases
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );

    return (
        <div className="w-full">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Cases</h1>
                    <button
                        onClick={onAddCaseClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Case
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search cases..."
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

                {/* Loading State */}
                {isCasesLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error State */}
                {casesError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{casesError}</span>
                    </div>
                )}

                {/* Cases List */}
                {!isCasesLoading && !casesError && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Name</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Number</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAndSortedCases.length > 0 ? (
                                    filteredAndSortedCases.map((caseItem) => (
                                        <tr key={caseItem._id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-medium">
                                                            {caseItem.caseName[0]}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {caseItem.caseName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatDate(caseItem.updatedAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-500">
                                                {caseItem.caseNumber || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    caseItem.status === 'open' ? 'bg-green-100 text-green-800' :
                                                    caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    caseItem.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-blue-100 text-blue-800' // on_hold or other
                                                }`}>
                                                    {caseItem.status.replace('_', ' ').charAt(0).toUpperCase() + caseItem.status.replace('_', ' ').slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onViewCase(caseItem._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                                                        title="View Case"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onEditCase(caseItem._id)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                                                        title="Edit Case"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteCase(caseItem._id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                                                        title="Delete Case"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                            No cases found. {searchTerm ? 'Try a different search term.' : 'Get started by creating a new case.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaseList;
