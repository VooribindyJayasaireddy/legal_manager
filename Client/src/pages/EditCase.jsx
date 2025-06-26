import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Gavel, Calendar, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../utils/api';

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' }
];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch case details
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No case ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch case details
        const caseResponse = await api.get(`/cases/${id}`);
        
        if (caseResponse.data.success) {
          const caseData = caseResponse.data.data;
          // Format dates for input fields
          const formattedData = {
            ...caseData,
            startDate: caseData.startDate ? formatDateForInput(caseData.startDate) : '',
            endDate: caseData.endDate ? formatDateForInput(caseData.endDate) : ''
          };
          setFormData(formattedData);
        } else {
          setError(caseResponse.data.message || 'Failed to load case details');
        }
      } catch (err) {
        console.error('Error fetching case data:', err);
        const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to load case data. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
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
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading case details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
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
      </Layout>
    );
  }

  // Show loading state while submitting
  if (isSubmitting) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Updating case...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} /> Back to Case
          </button>
          <h1 className="text-2xl font-bold">Edit Case</h1>
          <div className="w-6"></div> {/* For alignment */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} />
              <h2 className="font-semibold text-lg">Case Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="caseName"
                  value={formData.caseName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  required
                />
                {formErrors.caseName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caseName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  required
                />
                {formErrors.caseNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caseNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  required
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
                {formErrors.caseType && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caseType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  required
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
              </div>
            </div>
          </div>

          {/* Case Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={20} />
              <h2 className="font-semibold text-lg">Case Timeline</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    required
                  />
                </div>
                {formErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                {formErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Court Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Gavel size={20} />
              <h2 className="font-semibold text-lg">Court Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court
                </label>
                <input
                  type="text"
                  name="court"
                  value={formData.court || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  name="jurisdiction"
                  value={formData.jurisdiction || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Case Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} />
              <h2 className="font-semibold text-lg">Case Description</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                placeholder="Enter a detailed description of the case..."
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} />
              <h2 className="font-semibold text-lg">Notes</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                placeholder="Add any internal notes about this case..."
              />
            </div>
          </div>

          {/* Reference Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} />
              <h2 className="font-semibold text-lg">Reference Information</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External Reference ID
              </label>
              <input
                type="text"
                name="externalId"
                value={formData.externalId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                placeholder="Enter external reference ID"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {isSubmitting ? (
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
        </form>
      </div>
    </Layout>
  );
};

export default EditCase;
