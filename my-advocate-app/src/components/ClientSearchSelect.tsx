import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface ClientOption {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

interface ClientSearchSelectProps {
    value: string[];
    onChange: (selectedIds: string[]) => void;
    onLogout: () => void;
    error?: string;
    isMulti?: boolean;
}

const ClientSearchSelect: React.FC<ClientSearchSelectProps> = ({
    value,
    onChange,
    onLogout,
    error,
    isMulti = true
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fetch clients based on search term or get all clients
    const fetchClients = async (query?: string) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                onLogout();
                return [];
            }
            
            let url = 'http://localhost:5000/api/clients';
            if (query && query.trim().length >= 2) {
                url = `http://localhost:5000/api/clients/search?q=${encodeURIComponent(query.trim())}`;
            }
            
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched clients:', data);
                return Array.isArray(data) ? data : [];
            } else if (response.status === 401 || response.status === 403) {
                onLogout();
                return [];
            } else {
                console.error('Failed to fetch clients:', response.status, await response.text());
                return [];
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search input changes with debounce
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchClients(searchTerm).then(setClients);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, onLogout]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (client: ClientOption) => {
        if (isMulti) {
            const newValue = value.includes(client._id)
                ? value.filter(id => id !== client._id)
                : [...value, client._id];
            onChange(newValue);
        } else {
            onChange([client._id]);
            setSearchTerm(`${client.firstName} ${client.lastName}`);
            setIsOpen(false);
        }
    };

    const removeClient = (clientId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== clientId));
    };

    const getClientById = (id: string) => {
        return clients.find(c => c._id === id) || { firstName: 'Unknown', lastName: 'Client' };
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Clients {!isMulti && '(Select one)'}
            </label>
            
            <div 
                className={`relative cursor-pointer border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 min-h-12 flex flex-wrap items-center gap-2`}
                onClick={async () => {
                    setSearchTerm('');
                    setIsLoading(true);
                    const allClients = await fetchClients();
                    setClients(allClients);
                    setIsOpen(true);
                }}
            >
                {value.length > 0 ? (
                    value.map(id => {
                        const client = getClientById(id);
                        return (
                            <span 
                                key={id}
                                className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                            >
                                {client.firstName} {client.lastName}
                                <button 
                                    type="button" 
                                    onClick={(e) => removeClient(id, e)}
                                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300"
                                >
                                    <XMarkIcon className="h-3 w-3 text-blue-700" />
                                </button>
                            </span>
                        );
                    })
                ) : (
                    <span className="text-gray-500">Search for clients...</span>
                )}
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-auto">
                    <div className="px-4 py-2 border-b sticky top-0 bg-white z-10">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            {searchTerm ? 'Searching...' : 'All clients'}
                            {searchTerm && searchTerm.length < 2 && ' (type at least 2 characters to filter)'}
                        </p>
                    </div>
                    
                    {isLoading ? (
                        <div className="px-4 py-2 text-gray-500">Loading...</div>
                    ) : clients.length > 0 ? (
                        clients.map((client) => (
                            <div
                                key={client._id}
                                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${value.includes(client._id) ? 'bg-blue-50' : ''}`}
                                onClick={() => handleSelect(client)}
                            >
                                <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                    <div className="font-medium">{client.firstName} {client.lastName}</div>
                                    {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
                                </div>
                            </div>
                        ))
                    ) : searchTerm ? (
                        <div className="px-4 py-2 text-gray-500">No clients found</div>
                    ) : (
                        <div className="px-4 py-2 text-gray-500">Start typing to search for clients</div>
                    )}
                </div>
            )}
            
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default ClientSearchSelect;
