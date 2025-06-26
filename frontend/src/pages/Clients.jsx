import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  UserPlus,
  Search, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  Gavel,
  Scale,
  Briefcase,
  FileText,
  Building2,
  Landmark,
  Filter,
  FileDown,
  ChevronDown
} from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';

// Color scheme
const colors = {
  primary: '#000000',    // Black
  secondary: '#333333',  // Dark gray
  accent: '#666666',     // Medium gray
  light: '#f5f5f5',     // Light gray
  dark: '#000000'       // Black
};

// Memoized Client Card Component
const ClientCard = memo(({ client, onView, onDelete }) => {
  const handleCardClick = (e) => {
    // Navigate to view the client details
    onView(client._id, e);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(client._id, e);
    }
  };
  
  const { _id, firstName, lastName, email, phone, address, notes, createdAt, occupation } = client;
  
  // Format location from address object
  const location = address ? [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country
  ].filter(Boolean).join(', ') : '';
  
  return (
    <div 
      className="border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-gray-100 hover:shadow-sm transition-all duration-200 group"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="relative">
          <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-medium text-gray-800 flex-shrink-0">
            {firstName ? firstName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-600 rounded-full border-2 border-white"></div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {[firstName, lastName].filter(Boolean).join(' ') || 'Unnamed Client'}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-black p-1.5 rounded-md hover:bg-gray-200 transition-colors duration-150"
                title="Delete client"
                aria-label="Delete client"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button className="text-gray-500 hover:text-black p-1.5 rounded-md hover:bg-gray-200 transition-colors duration-150">
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>
          {occupation && (
            <p className="text-sm text-gray-500 mt-0.5">{occupation}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {email && (
              <div className="flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center">
                <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <span>{phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 self-end sm:self-center whitespace-nowrap">
        {createdAt && (
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
});

ClientCard.displayName = 'ClientCard';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const navigate = useNavigate();
  const pageSize = 20; // Number of clients to load per page

  // Fetch clients with pagination
  const fetchClients = useCallback(async (pageNum = 1) => {
    try {
      const response = await api.get(`/clients?page=${pageNum}&limit=${pageSize}`);
      setClients(prev => pageNum === 1 ? response.data : [...prev, ...response.data]);
      setHasMore(response.data.length === pageSize);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Initial load
  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

  // Calculate statistics with useMemo to prevent recalculation on every render
  const { totalClients, newThisMonth } = useMemo(() => {
    if (!clients.length) return { totalClients: 0, newThisMonth: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const newClientsThisMonth = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === currentMonth && 
             clientDate.getFullYear() === currentYear;
    });
    
    return {
      totalClients: clients.length,
      newThisMonth: newClientsThisMonth.length
    };
  }, [clients]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    
    const term = searchTerm.toLowerCase();
    return clients.filter(client => 
      (client.firstName && client.firstName.toLowerCase().includes(term)) ||
      (client.lastName && client.lastName.toLowerCase().includes(term)) ||
      (client.email && client.email.toLowerCase().includes(term)) ||
      (client.phone && client.phone.includes(term)) ||
      (client.occupation && client.occupation.toLowerCase().includes(term))
    );
  }, [clients, searchTerm]);

  // Handle view navigation
  const handleViewClient = useCallback((id, e) => {
    if (e) e.stopPropagation();
    navigate(`/clients/${id}`);
  }, [navigate]);

  // Show notification
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // Handle delete button click
  const handleDeleteClick = useCallback((clientId, e) => {
    if (e) e.stopPropagation();
    setClientToDelete(clientId);
  }, []);

  // Handle client deletion
  const handleDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // In a real app, you would make an API call here
      // await api.delete(`/clients/${clientToDelete}`);
      
      // For demo purposes, we'll just remove it from the local state
      setClients(prevClients => prevClients.filter(client => client._id !== clientToDelete));
      
      showNotification('success', 'Client deleted successfully');
      setClientToDelete(null);
    } catch (err) {
      console.error('Error deleting client:', err);
      showNotification('error', 'Failed to delete client. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [clientToDelete]);
  
  const handleAddClient = useCallback((e) => {
    if (e) e.preventDefault();
    navigate('/clients/new');
  }, [navigate]);

  // Load more clients when scrolling
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Load more when scrolled to 80% of the page
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      setPage(prev => {
        const nextPage = prev + 1;
        fetchClients(nextPage);
        return nextPage;
      });
    }
  }, [loading, hasMore, fetchClients]);

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <Layout>
      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !isDeleting && setClientToDelete(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Delete Client
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this client? This action cannot be undone and will permanently remove all associated data.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteClient}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setClientToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div 
          className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg border ${
            notification.type === 'error' 
              ? 'bg-rose-50 border-rose-200' 
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                notification.type === 'error' 
                  ? 'text-rose-800' 
                  : 'text-emerald-800'
              }`}>
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Scale className="h-6 w-6 text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
          </div>
          <button
            onClick={handleAddClient}
            className="inline-flex items-center px-4 py-2.5 border border-black text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
          >
            <UserPlus className="-ml-1 mr-2 h-5 w-5" />
            Add New Client
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-800">{totalClients}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-blue-600">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-shrink-0 bg-green-50 p-3 rounded-lg">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">New This Month</p>
                  <p className="text-2xl font-bold text-gray-800">{newThisMonth}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${Math.min(100, (newThisMonth / Math.max(1, totalClients)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition duration-150 ease-in-out"
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 flex items-center">
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filter
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </button>
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</div>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Active</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Inactive</a>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</div>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Missing Email</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Missing Phone</a>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</div>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Last 7 Days</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">This Month</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">This Year</a>
                </div>
              </div>
              <div className="relative group">
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 flex items-center">
                  <FileDown className="h-4 w-4 mr-1.5" />
                  Export
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-10 hidden group-hover:block">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as CSV</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as PDF</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as Excel</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading && clients.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-2">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? (
                  'No clients match your search. Try a different search term.'
                ) : (
                  'Get started by adding a new client.'
                )}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddClient}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add Client
                  </button>
                </div>
              )}
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-sm font-medium text-black hover:text-gray-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <li key={client._id} className="group">
                  <ClientCard 
                    client={client}
                    onView={handleViewClient}
                    onDelete={handleDeleteClick}
                  />
                </li>
              ))}
              {loading && hasMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Clients;
