import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateCase = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    caseName: '',
    caseType: '',
    caseNumber: '',
    startDate: '',
    endDate: '',
    status: 'open',
    description: '',
    court: '',
    jurisdiction: '',
    clientIds: [],
    notes: '',
    externalId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // State for client search and selection
  const [availableClients, setAvailableClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoadingClients(true);
        const response = await axios.get('/api/clients', {
          params: { search: searchQuery },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAvailableClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };
    
    const timer = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        fetchClients();
      } else {
        setAvailableClients([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Handle client selection
  const handleClientSelect = (client) => {
    if (!selectedClients.some(c => c._id === client._id)) {
      setSelectedClients([...selectedClients, client]);
      setFormData(prev => ({
        ...prev,
        clientIds: [...prev.clientIds, client._id]
      }));
      setSearchQuery('');
      setIsDropdownOpen(false);
    }
  };
  
  // Remove selected client
  const removeClient = (clientId) => {
    setSelectedClients(selectedClients.filter(c => c._id !== clientId));
    setFormData(prev => ({
      ...prev,
      clientIds: prev.clientIds.filter(id => id !== clientId)
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.caseName.trim()) newErrors.caseName = 'Case name is required';
    if (!formData.caseNumber.trim()) newErrors.caseNumber = 'Case number is required';
    if (!formData.caseType) newErrors.caseType = 'Case type is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      // Prepare the data to send
      const caseData = {
        ...formData,
        clients: selectedClients.map(client => client._id)
      };
      
      console.log('Sending case data:', caseData);
      
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(caseData)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Received non-JSON response from server');
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('API Error:', result);
        throw new Error(result?.message || `Failed to create case. Status: ${response.status}`);
      }

      console.log('Case created successfully:', result);
      
      // Redirect to the cases list page for better overview
      navigate('/cases');
    } catch (error) {
      console.error('Error creating case:', error);
      setErrors(prev => ({
        ...prev,
        form: error.message || 'Failed to create case. Please check your connection and try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Case</h1>
      
      <form onSubmit={handleFormSubmit} className="space-y-8" noValidate>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">Essential Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Case Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border ${errors.caseName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.caseName}
                onChange={(e) => handleChange('caseName', e.target.value)}
              />
              {errors.caseName && <p className="text-sm text-red-600">{errors.caseName}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Case Type <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.caseType}
                onChange={(e) => handleChange('caseType', e.target.value)}
              >
                <option value="">Select case type</option>
                <option value="civil">Civil</option>
                <option value="criminal">Criminal</option>
                <option value="family">Family</option>
                <option value="corporate">Corporate</option>
                <option value="property">Property</option>
                <option value="labor">Labor</option>
                <option value="tax">Tax</option>
                <option value="intellectual_property">Intellectual Property</option>
                <option value="bankruptcy">Bankruptcy</option>
                <option value="immigration">Immigration</option>
                <option value="constitutional">Constitutional</option>
                <option value="environmental">Environmental</option>
                <option value="real_estate">Real Estate</option>
                <option value="wills_trusts">Wills & Trusts</option>
                <option value="personal_injury">Personal Injury</option>
                <option value="medical_malpractice">Medical Malpractice</option>
                <option value="employment">Employment</option>
                <option value="consumer_protection">Consumer Protection</option>
                <option value="cyber_law">Cyber Law</option>
                <option value="other">Other</option>
              </select>
              {errors.caseType && <p className="text-sm text-red-600">{errors.caseType}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Case Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border ${errors.caseNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.caseNumber}
                onChange={(e) => handleChange('caseNumber', e.target.value)}
                required
              />
              {errors.caseNumber && <p className="text-sm text-red-600">{errors.caseNumber}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full px-3 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
              {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">Status & Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="on_hold">On Hold</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">Case Details</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Court
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.court}
                  onChange={(e) => handleChange('court', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.jurisdiction}
                  onChange={(e) => handleChange('jurisdiction', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Clients
              </label>
              <div className="space-y-2">
                {/* Selected clients */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedClients.map(client => (
                    <span key={client._id} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                      {client.name}
                      <button
                        type="button"
                        onClick={() => removeClient(client._id)}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                      >
                        <span className="sr-only">Remove client</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                
                {/* Client search input */}
                <div className="relative">
                  <div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim() !== '') {
                          setIsDropdownOpen(true);
                        } else {
                          setIsDropdownOpen(false);
                        }
                      }}
                      onFocus={() => searchQuery.trim() !== '' && setIsDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                    />
                  </div>
                  
                  {/* Loading indicator */}
                  {isLoadingClients && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {/* Dropdown menu */}
                  {isDropdownOpen && availableClients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {availableClients.filter(client => 
                        !selectedClients.some(selected => selected._id === client._id)
                      ).map(client => (
                        <div
                          key={client._id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      ))}
                      {availableClients.filter(client => 
                        !selectedClients.some(selected => selected._id === client._id)
                      ).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">No more clients found</div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Helper text */}
                <p className="text-xs text-gray-500">
                  Search and select clients to associate with this case
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">Additional Information</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                External ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.externalId}
                onChange={(e) => handleChange('externalId', e.target.value)}
                placeholder="External reference ID (if any)"
              />
            </div>
          </div>
        </div>

        {errors.form && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.form}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCase;
