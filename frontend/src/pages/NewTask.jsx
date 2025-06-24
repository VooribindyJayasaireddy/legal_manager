import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, AlertCircle, User, Briefcase, Loader2, X, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

// Custom Searchable Select Component
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

const NewTask = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    assignedTo: null,
    assignedName: '',
    clientId: '',
    caseId: ''
  });
  
  const [showCustomName, setShowCustomName] = useState(false);
  const [showCustomClient, setShowCustomClient] = useState(false);
  const [customClientName, setCustomClientName] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users').catch(() => ({}));
        // Handle different response formats
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
        const casesData = Array.isArray(response?.data?.cases || response?.data) 
          ? (response.data.cases || response.data)
          : [];
            
        setCases(casesData);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases. You can add the case ID manually.');
      } finally {
        setLoadingCases(false);
      }
    };

    fetchUsers();
    fetchClients();
    fetchCases();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare task data
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        assignedTo: formData.assignedTo || undefined,
        assignedName: formData.assignedName || undefined,
        clientId: formData.clientId || undefined,
        caseId: formData.caseId || undefined
      };

      await api.post('/tasks', taskData);
      navigate('/tasks');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Tasks
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600">Fill in the details below to create a new task</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
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
              <div className="space-y-6">
                {/* Task Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Task Title *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                      placeholder="Enter task title"
                    />
                  </div>
                </div>


                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                      placeholder="Add task details..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="mt-1">
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <div className="mt-1">
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        id="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                        Assigned To 
                      </label>
                      {!showCustomName && (
                        <button
                          type="button"
                          onClick={() => setShowCustomName(true)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                         Add new person
                        </button>
                      )}
                    </div>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      {loadingUsers ? (
                        <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                        </div>
                      ) : showCustomName ? (
                        <div className="flex">
                          <input
                            type="text"
                            name="assignedName"
                            value={formData.assignedName}
                            onChange={handleChange}
                            className="flex-1 block w-full pl-10 border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                            placeholder="Enter person's name"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomName(false);
                              setFormData(prev => ({ ...prev, assignedName: '' }));
                            }}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm rounded-r-md"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <select
                          id="assignedTo"
                          name="assignedTo"
                          value={formData.assignedTo || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm appearance-none bg-white"
                        >
                          <option value="">Unassigned</option>
                          {Array.isArray(users) && users.length > 0 && (
                            <optgroup label="Team Members">
                              {users.map((user) => (
                                <option key={user._id || user.id} value={user._id || user.id}>
                                  {user.firstName || user.name || 'User'} {user.lastName || ''} 
                                  {user.email ? `(${user.email})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Case and Client */}
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Case ID */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case 
                      </label>
                      <SearchableSelect
                        options={cases}
                        value={formData.caseId}
                        onChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}
                        placeholder="Select a case"
                        loading={loadingCases}
                        error={!loadingCases && cases.length === 0}
                        icon={Briefcase}
                        getOptionLabel={(item) => {
                          const label = item.caseNumber || item.title || `Case ${item._id || item.id}`;
                          return item.title && !item.caseNumber ? `${label} - ${item.title}` : label;
                        }}
                      />
                    </div>

                    {/* Client */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client
                      </label>
                      <SearchableSelect
                        options={clients}
                        value={formData.clientId}
                        onChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                        placeholder="Select a client"
                        loading={loadingClients}
                        error={!loadingClients && clients.length === 0}
                        icon={User}
                        getOptionLabel={(client) => client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim()}
                      />
                    </div>
                  </div>


                  
                 
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-4 w-4" />
                      Save Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewTask;
