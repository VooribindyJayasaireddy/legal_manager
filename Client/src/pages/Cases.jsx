import React, { useState, useEffect, useContext } from "react";
import { Eye, Pencil, ChevronDown, Search, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from "../utils/api";
import Layout from "../components/Layout";

const CasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '', show: false });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    on_hold: 0,
    closed: 0,
    archived: 0
  });

  const statusColor = {
    open: "bg-gray-100 text-gray-800 border border-gray-300",
    pending: "bg-gray-100 text-gray-800 border border-gray-300",
    on_hold: "bg-gray-100 text-gray-800 border border-gray-300",
    closed: "bg-gray-200 text-gray-800 border border-gray-400",
    archived: "bg-gray-100 text-gray-800 border border-gray-300",
  };

  // Show notification
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, show: true });
    const timer = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch cases from API
  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching cases from API...');
      
      // Fetch cases and stats in parallel
      const [casesResponse, statsResponse] = await Promise.all([
        api.get('/cases').catch(err => {
          console.error('Error fetching cases:', err);
          return { data: [] }; // Return empty array if cases fetch fails
        }),
        api.get('/cases/stats').catch(err => {
          console.error('Error fetching stats:', err);
          return { data: {} }; // Return empty stats if stats fetch fails
        })
      ]);
      
      console.log('API Response - Cases:', casesResponse.data);
      console.log('API Response - Stats:', statsResponse.data);
      
      // Only update cases if we got a valid response
      if (Array.isArray(casesResponse.data)) {
        setCases(casesResponse.data);
      } else {
        console.error('Invalid cases data format:', casesResponse.data);
        setError('Invalid cases data format received from server');
        return;
      }
      
      // Update stats with fallback values
      const statsData = statsResponse.data || {};
      setStats({
        total: statsData.total,
        open: statsData.open,
        pending: statsData.pending,
        on_hold: statsData.on_hold,
        closed: statsData.closed,
        archived: statsData.archived
      });
      
    } catch (err) {
      console.error('Error in fetchCases:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to load cases. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases on component mount
  useEffect(() => {
    fetchCases();
  }, []);

  // Handle case status update
  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      setLoading(true);
      await api.patch(`/cases/${caseId}`, { status: newStatus });
      // Update the local state instead of refetching all cases
      setCases(cases.map(c => 
        c._id === caseId ? { ...c, status: newStatus } : c
      ));
      
      // Show success notification
      showNotification('success', 'Case status updated successfully');
      
    } catch (err) {
      console.error('Error updating case status:', err);
      showNotification('error', err.response?.data?.message || 'Failed to update case status');
    } finally {
      setLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Define all possible case types from the backend model
  const allCaseTypes = [
    'civil',
    'criminal',
    'family',
    'corporate',
    'property',
    'labor',
    'tax',
    'intellectual_property',
    'bankruptcy',
    'immigration',
    'constitutional',
    'environmental',
    'real_estate',
    'wills_trusts',
    'personal_injury',
    'medical_malpractice',
    'employment',
    'consumer_protection',
    'cyber_law',
    'other'
  ];

  // Get case types that are actually in use
  const getUsedCaseTypes = () => {
    const usedTypes = new Set();
    cases.forEach(caseItem => {
      if (caseItem.caseType) {
        usedTypes.add(caseItem.caseType);
      }
    });
    return Array.from(usedTypes).sort();
  };
  
  const usedCaseTypes = getUsedCaseTypes();

  // Filter cases based on search and filters
  const filteredCases = cases.filter((caseItem) => {
    // Convert all searchable fields to lowercase for case-insensitive search
    const searchLower = searchQuery.trim().toLowerCase();
    const caseName = (caseItem.caseName || '').toLowerCase();
    const caseNumber = (caseItem.caseNumber || '').toLowerCase();
    const clientNames = caseItem.clients && Array.isArray(caseItem.clients) 
      ? caseItem.clients.map(c => (c.name || '').toLowerCase()).join(' ') 
      : '';
    const caseType = (caseItem.caseType || '').toLowerCase();
    const court = (caseItem.court || '').toLowerCase();
    const description = (caseItem.description || '').toLowerCase();
    
    // Match search query against multiple fields
    const matchesSearch = searchQuery === '' || 
      caseName.includes(searchLower) ||
      caseNumber.includes(searchLower) ||
      clientNames.includes(searchLower) ||
      caseType.includes(searchLower) ||
      court.includes(searchLower) ||
      description.includes(searchLower);
    
    // Apply filters
    const matchesStatus = statusFilter === 'all' || 
      (caseItem.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || 
      (caseItem.caseType || '').toLowerCase() === typeFilter.toLowerCase();
    const matchesCourt = courtFilter === 'all' || 
      (caseItem.court || '').toLowerCase() === courtFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType && matchesCourt;
  });
  
  // Get unique courts for filter dropdowns
  const uniqueCourts = [...new Set(cases.map(c => c.court).filter(Boolean))].sort();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get client names from case
  const getClientNames = (clients) => {
    if (!clients || !Array.isArray(clients)) return 'No clients';
    return clients.map(client => client.name || 'Unnamed Client').join(', ');
  };

  // Handle case deletion
  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/cases/${caseToDelete}`);
      
      // Remove the deleted case from the list
      setCases(cases.filter(c => c._id !== caseToDelete));
      setShowDeleteModal(false);
      setCaseToDelete(null);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
      
      // Show success notification
      showNotification('success', 'Case deleted successfully');
      
    } catch (err) {
      console.error('Error deleting case:', err);
      showNotification('error', err.response?.data?.message || 'Failed to delete case');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Confirm delete
  const confirmDelete = (caseId, e) => {
    if (e) e.stopPropagation();
    setCaseToDelete(caseId);
    setShowDeleteModal(true);
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading cases...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchCases}
                className="mt-2 text-sm text-gray-900 hover:text-black font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render delete confirmation modal
  const renderDeleteModal = () => (
    <div className={`fixed z-50 inset-0 overflow-y-auto ${showDeleteModal ? '' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-red-200">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delete Case
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-800">
                  Are you sure you want to delete this case? This action cannot be undone and all associated documents will be permanently removed.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              onClick={handleDeleteCase}
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
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => {
                setShowDeleteModal(false);
                setCaseToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the main content
  const renderContent = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <button
          onClick={() => navigate('/cases/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          New Case
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search cases by name, number, client, type, or court..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-auto">
            <select
              className="block appearance-none w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 rounded-md bg-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                textIndent: '1px',
                textOverflow: ''
              }}
            >
              <option value="all">All Types</option>
              {allCaseTypes.map((type) => {
                // Format the type for display (convert underscores to spaces and capitalize words)
                const displayType = type
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                  
                return (
                  <option key={type} value={type}>
                    {displayType}
                    {!usedCaseTypes.includes(type) && ' (No cases)'}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <select
              className="block appearance-none w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 rounded-md bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                textIndent: '1px',
                textOverflow: ''
              }}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="on_hold">On Hold</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              className="block appearance-none w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 rounded-md bg-white"
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                textIndent: '1px',
                textOverflow: ''
              }}
            >
              <option value="all">All Courts</option>
              {uniqueCourts.map((court) => (
                <option key={court} value={court.toLowerCase()}>
                  {court}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
                    </div>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500">
                    No cases found. {statusFilter !== 'all' && 'Try changing your filters.'}
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem) => (
                  <tr 
                    key={caseItem._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/cases/${caseItem._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 font-medium">
                          {caseItem.caseName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.caseName || 'Unnamed Case'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {caseItem.caseNumber || 'No number'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseItem.caseNumber || 'N/A'}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getClientNames(caseItem.clients)}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[caseItem.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {caseItem.status ? caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1).replace('_', ' ') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseItem.caseType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseItem.court || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caseItem.startDate)}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => confirmDelete(caseItem._id, e)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete case"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Wrap the content with Layout
  return (
    <>
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
                  className="inline-flex rounded-md focus:outline-none text-gray-900 hover:text-black"
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        {renderContent()}
        {renderDeleteModal()}
      </Layout>
    </>
  );
};

export default CasesPage;
