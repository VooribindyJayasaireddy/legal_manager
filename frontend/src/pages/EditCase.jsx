import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import api from '../utils/api';

const EditCase = () => {
  const { id } = useParams();
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
    notes: '',
    externalId: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch case details
  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!id) {
        setError('No case ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/cases/${id}`);
        
        if (response.data.success) {
          const caseData = response.data.data;
          // Format dates for input fields
          const formattedData = {
            ...caseData,
            startDate: caseData.startDate ? formatDateForInput(caseData.startDate) : '',
            endDate: caseData.endDate ? formatDateForInput(caseData.endDate) : ''
          };
          setFormData(formattedData);
        } else {
          setError(response.data.message || 'Failed to load case details');
        }
      } catch (err) {
        console.error('Error fetching case details:', err);
        const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to load case details. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.caseName.trim()) errors.caseName = 'Case name is required';
    if (!formData.caseNumber.trim()) errors.caseNumber = 'Case number is required';
    if (!formData.caseType) errors.caseType = 'Please select a case type';
    if (!formData.status) errors.status = 'Please select a status';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Use a ref to track if the component is still mounted
    let isMounted = true;
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      
      const response = await api.put(`/cases/${id}`, formData);
      console.log('Update response:', response);
      
      if (!isMounted) return; // Don't update state if component unmounted
      
      // Check if response.data exists and has the expected structure
      if (response && response.data) {
        if (response.data.case) {
          // Success - navigate to case details
          navigate(`/cases/${id}`, { 
            replace: true,
            state: { 
              fromEdit: true,
              message: 'Case updated successfully'
            }
          });
          return;
        } else {
          throw new Error(response.data.message || 'Failed to update case');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error updating case:', err);
      
      if (!isMounted) return; // Don't update state if component unmounted
      
      let errorMessage = 'Failed to update case. Please try again.';
      
      if (err.response) {
        errorMessage = err.response.data?.message || 
                     err.response.statusText || 
                     `Server responded with status ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      if (isMounted) {
        setIsSubmitting(false);
      }
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error {error.includes('loading') ? 'loading' : 'updating'} case</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mr-2"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cases')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Cases
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while submitting
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Updating case...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Case
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Edit Case</h2>
        <div className="w-24"></div> {/* For alignment */}
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {formData.caseName || 'Edit Case Details'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Update the case information below.
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            {/* Case Name */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Case Name <span className="text-red-500">*</span>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="caseName"
                  value={formData.caseName}
                  onChange={handleChange}
                  className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.caseName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {formErrors.caseName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caseName}</p>
                )}
              </dd>
            </div>

            {/* Case Number */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Case Number <span className="text-red-500">*</span>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={handleChange}
                  className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.caseNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {formErrors.caseNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caseNumber}</p>
                )}
              </dd>
            </div>

            {/* Status */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Status <span className="text-red-500">*</span>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.status ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
                {formErrors.status && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.status}</p>
                )}
              </dd>
            </div>

            {/* Case Type */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Case Type <span className="text-red-500">*</span>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.caseType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                >
                  <option value="">Select a case type</option>
                  <option value="civil">Civil</option>
                  <option value="criminal">Criminal</option>
                  <option value="family">Family</option>
                  <option value="corporate">Corporate</option>
                  <option value="property">Property</option>
                  <option value="labor">Labor</option>
                  <option value="tax">Tax</option>
                  <option value="intellectual_property">Intellectual Property</option>
                  <option value="other">Other</option>
                </select>
                {formErrors.caseType && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caseType}</p>
                )}
              </dd>
            </div>

            {/* Court */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Court</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="court"
                  value={formData.court || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>

            {/* Jurisdiction */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="jurisdiction"
                  value={formData.jurisdiction || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>

            {/* Start Date */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>

            {/* End Date */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>

            {/* Description */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>

            {/* External ID */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">External ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="externalId"
                  value={formData.externalId || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </dd>
            </div>
          </dl>
        </div>

        {/* Form Actions */}
        <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCase;
