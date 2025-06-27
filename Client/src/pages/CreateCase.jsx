import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    notes: '',
    externalId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      console.log('Sending case data:', formData);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);

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
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
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
