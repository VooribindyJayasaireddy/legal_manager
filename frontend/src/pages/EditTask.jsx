import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, AlertCircle, User, Briefcase, Loader2, X, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

// Reuse the SearchableSelect component from NewTask
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Search...',
  loading = false,
  error = false,
  icon: Icon,
  maxItems = 5,
  getOptionLabel = (option) => option.name || option.title || option.id,
  getOptionValue = (option) => option.id || option._id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  }).slice(0, maxItems);

  // Get selected option
  const selectedOption = options.find(option => getOptionValue(option) === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="flex items-center justify-between w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {Icon && <Icon className="h-5 w-5 text-gray-400 mr-2" />}
          <span className="truncate">
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {/* Search input */}
          <div className="px-3 py-2 border-b">
            <div className="relative">
              <input
                type="text"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-black focus:border-black"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="px-4 py-2 text-sm text-red-500">
              Failed to load options
            </div>
          )}

          {/* No results */}
          {!loading && !error && filteredOptions.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              No results found
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <div
                key={getOptionValue(option)}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  value === getOptionValue(option) ? 'bg-gray-100 font-medium' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(getOptionValue(option));
                  setIsOpen(false);
                }}
              >
                {getOptionLabel(option)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    clientId: '',
    caseId: '',
    completedNotes: ''
  });
  
  const [showCustomName, setShowCustomName] = useState(false);
  const [showCustomClient, setShowCustomClient] = useState(false);
  const [customClientName, setCustomClientName] = useState('');

  // Fetch task data and related data
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tasks/${id}`);
        const task = response.data;
        
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          assignedTo: task.assignedTo?._id || '',
          clientId: task.client?._id || '',
          caseId: task.case?._id || '',
          completedNotes: task.completedNotes || ''
        });
        
        // Set custom client name if needed
        if (task.client && !task.client._id && task.client.name) {
          setShowCustomClient(true);
          setCustomClientName(task.client.name);
        }
        
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await api.get('/users').catch(() => ({}));
        const usersData = Array.isArray(response?.data) 
          ? response.data 
          : Array.isArray(response) 
            ? response 
            : [];
            
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. You can save the task without assigning it for now.');
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await api.get('/clients').catch(() => ({}));
        const clientsData = Array.isArray(response?.data) 
          ? response.data 
          : Array.isArray(response) 
            ? response 
            : [];
            
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. You can add the client later.');
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    const fetchCases = async () => {
      try {
        const response = await api.get('/cases').catch(() => ({}));
        const casesData = Array.isArray(response?.data) 
          ? response.data 
          : Array.isArray(response) 
            ? response 
            : [];
            
        setCases(casesData);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases. You can add the case later.');
        setCases([]);
      } finally {
        setLoadingCases(false);
      }
    };

    // Fetch all data in parallel
    Promise.all([
      fetchTask(),
      fetchUsers(),
      fetchClients(),
      fetchCases()
    ]);
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      // Prepare the data to send
      const taskData = {
        ...formData,
        // If using a custom client name, include it
        ...(showCustomClient && customClientName && { customClientName })
      };
      
      // Remove empty fields
      Object.keys(taskData).forEach(key => {
        if (taskData[key] === '' || taskData[key] == null) {
          delete taskData[key];
        }
      });
      
      // Send the update request
      const response = await api.put(`/tasks/${id}`, taskData);
      
      // Redirect to task details on success
      navigate(`/tasks/${response.data._id}`);
      
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.message || 'Failed to update task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle status change to show/hide completed notes
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFormData(prev => ({
      ...prev,
      status: newStatus
    }));
  };

  // Toggle custom client input
  const toggleCustomClient = () => {
    setShowCustomClient(!showCustomClient);
    if (!showCustomClient) {
      // Clear the client ID when showing custom client
      setFormData(prev => ({
        ...prev,
        clientId: ''
      }));
    } else {
      // Clear custom client name when hiding
      setCustomClientName('');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Task</h1>
          <div className="w-20"></div> {/* For alignment */}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Task Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  placeholder="Add a detailed description of the task"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="dueDate"
                      id="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                    />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <SearchableSelect
                    options={users}
                    value={formData.assignedTo}
                    onChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                    placeholder="Select user"
                    loading={loadingUsers}
                    error={!loadingUsers && users.length === 0}
                    icon={User}
                    getOptionLabel={(user) => `${user.firstName} ${user.lastName}`}
                    getOptionValue={(user) => user._id}
                  />
                </div>

                {/* Client */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                      Client
                    </label>
                    <button
                      type="button"
                      onClick={toggleCustomClient}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showCustomClient ? 'Select from list' : 'Add new client'}
                    </button>
                  </div>
                  
                  {showCustomClient ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={customClientName}
                        onChange={(e) => setCustomClientName(e.target.value)}
                        className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                        placeholder="Enter client name"
                      />
                    </div>
                  ) : (
                    <SearchableSelect
                      options={clients}
                      value={formData.clientId}
                      onChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                      placeholder="Select client"
                      loading={loadingClients}
                      error={!loadingClients && clients.length === 0}
                      icon={User}
                      getOptionLabel={(client) => client.name || `${client.firstName} ${client.lastName}`}
                      getOptionValue={(client) => client._id}
                    />
                  )}
                </div>

                {/* Related Case */}
                <div>
                  <label htmlFor="caseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Related Case (Optional)
                  </label>
                  <SearchableSelect
                    options={cases}
                    value={formData.caseId}
                    onChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}
                    placeholder="Select case"
                    loading={loadingCases}
                    error={!loadingCases && cases.length === 0}
                    icon={Briefcase}
                    getOptionLabel={(caseItem) => caseItem.caseName || `Case #${caseItem.caseNumber}`}
                    getOptionValue={(caseItem) => caseItem._id}
                  />
                </div>
              </div>

              {/* Completed Notes (shown only when status is completed) */}
              {formData.status === 'completed' && (
                <div className="mt-6">
                  <label htmlFor="completedNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Completion Notes
                  </label>
                  <textarea
                    id="completedNotes"
                    name="completedNotes"
                    rows={3}
                    value={formData.completedNotes}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                    placeholder="Add any notes about the completion of this task"
                  />
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditTask;
