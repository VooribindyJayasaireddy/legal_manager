import React, { useState, useEffect, useCallback, ComponentType, SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';

// Create typed icon components
const SearchIcon = FiIcons.FiSearch as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const PlusIcon = FiIcons.FiPlus as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const MoreVerticalIcon = FiIcons.FiMoreVertical as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const MailIcon = FiIcons.FiMail as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const PhoneIcon = FiIcons.FiPhone as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const MapPinIcon = FiIcons.FiMapPin as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const CalendarIcon = FiIcons.FiCalendar as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const BriefcaseIcon = FiIcons.FiBriefcase as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const EditIcon = FiIcons.FiEdit2 as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const TrashIcon = FiIcons.FiTrash2 as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ChevronLeftIcon = FiIcons.FiChevronLeft as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ChevronRightIcon = FiIcons.FiChevronRight as React.ComponentType<React.SVGProps<SVGSVGElement>>;

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

interface ClientListPageProps {
    onAddClientClick: () => void;
    onViewClient: (clientId: string) => void;
    onEditClient: (clientId: string) => void;
    onDeleteClient: (clientId: string) => Promise<void>;
    onLogout: () => void;
}

const ClientList: React.FC<ClientListPageProps> = ({
    onAddClientClick,
    onViewClient,
    onEditClient,
    onDeleteClient,
    onLogout,
}) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [clientsPerPage] = useState(10);
    const navigate = useNavigate();

    // Fetch clients from API
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/clients', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch clients');
                }
                
                const data = await response.json();
                setClients(data);
                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setIsLoading(false);
            }
        };

        fetchClients();
    }, []);

    // Filter clients based on search term
    const filteredClients = clients.filter(client => {
        const searchLower = searchTerm.toLowerCase();
        return (
            client.firstName.toLowerCase().includes(searchLower) ||
            client.lastName.toLowerCase().includes(searchLower) ||
            client.email?.toLowerCase().includes(searchLower) ||
            client.phone?.includes(searchTerm) ||
            client.address?.city?.toLowerCase().includes(searchLower) ||
            client.address?.state?.toLowerCase().includes(searchLower) ||
            client.occupation?.toLowerCase().includes(searchLower)
        );
    });

    // Get current clients for pagination
    const indexOfLastClient = currentPage * clientsPerPage;
    const indexOfFirstClient = indexOfLastClient - clientsPerPage;
    const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get initials for avatar
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    // Handle page change
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-white shadow-sm z-10">
                <div className="px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={onAddClientClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Client
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Search and filter */}
                <div className="mb-6">
                    <div className="relative rounded-md shadow-sm max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border h-9"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Clients list container */}
                <div className="bg-white shadow overflow-hidden rounded-lg flex-1 flex flex-col">
                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex-1 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-2xl">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <div className="min-w-full overflow-hidden overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Added
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentClients.map((client) => (
                                            <tr key={client._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                                            {getInitials(client.firstName, client.lastName)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {client.firstName} {client.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {client.occupation || 'No occupation'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {client.email || 'No email'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {client.phone || 'No phone'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {client.address?.city || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {client.address?.state || ''} {client.address?.zipCode || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(client.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => onViewClient(client._id)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => onEditClient(client._id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteClient(client._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{indexOfFirstClient + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastClient, filteredClients.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{filteredClients.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    <ChevronLeftIcon className="h-5 w-5" />
                                                </button>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    // Show first page, last page, and pages around current page
                                                    let pageNum: number;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                currentPage === pageNum
                                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">Next</span>
                                                    <ChevronRightIcon className="h-5 w-5" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div className="mb-2 md:mb-0">© 2024 Client Management System. All rights reserved.</div>
                <div>Last synced: {new Date().toLocaleTimeString()}</div>
            </footer>
        </div>
    );
};

export default ClientList;
