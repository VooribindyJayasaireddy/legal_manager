import React, { useState, useEffect, useContext } from "react";
import { Eye, Pencil, ChevronDown, Search, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from "../utils/api";
import Layout from "../components/Layout";

const CasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    on_hold: 0,
    closed: 0,
    archived: 0
  });

  const statusColor = {
    open: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    on_hold: "bg-orange-100 text-orange-700",
    closed: "bg-gray-200 text-gray-700",
    archived: "bg-blue-100 text-blue-700",
  };

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
      
      
    } catch (err) {
      console.error('Error updating case status:', err);
      setError(err.response?.data?.message || 'Failed to update case status');
    } finally {
      setLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cases based on search and filters
  const filteredCases = cases.filter((caseItem) => {
    // Convert all searchable fields to lowercase for case-insensitive search
    const searchLower = searchQuery.toLowerCase();
    const caseName = (caseItem.caseName || '').toLowerCase();
    const caseNumber = (caseItem.caseNumber || '').toLowerCase();
    const clientNames = caseItem.clients && Array.isArray(caseItem.clients) 
      ? caseItem.clients.map(c => (c.name || '').toLowerCase()).join(' ') 
      : '';
    const caseType = (caseItem.caseType || '').toLowerCase();
    const court = (caseItem.court || '').toLowerCase();
    
    const matchesSearch = searchQuery === '' || 
      caseName.includes(searchLower) ||
      caseNumber.includes(searchLower) ||
      clientNames.includes(searchLower) ||
      caseType.includes(searchLower) ||
      court.includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || 
      (caseItem.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || 
      (caseItem.caseType || '').toLowerCase() === typeFilter.toLowerCase();
    const matchesCourt = courtFilter === 'all' || 
      (caseItem.court || '').toLowerCase() === courtFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType && matchesCourt;
  });
  
  // Get unique case types and courts for filter dropdowns
  const uniqueCaseTypes = [...new Set(cases.map(c => c.caseType).filter(Boolean))];
  const uniqueCourts = [...new Set(cases.map(c => c.court).filter(Boolean))];

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
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the main content
  const renderContent = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <button
          onClick={() => navigate('/cases/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-auto">
            <select
              className="block appearance-none w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
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
              {uniqueCaseTypes.map((type) => (
                <option key={type} value={type.toLowerCase()}>
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <select
              className="block appearance-none w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
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
              className="block appearance-none w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
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

          {(typeFilter !== 'all' || courtFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setCourtFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {getClientNames(caseItem.clients)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
  return <Layout>{renderContent()}</Layout>;
};

export default CasesPage;
