import React, { useState } from 'react';
import { ArrowLeft, User, MapPin, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../utils/api';
import countries from '../utils/countries';

const AddClient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    occupation: '',
    status: 'Active', // Default status
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',  // Changed from postalCode to zipCode
      country: 'USA'
    },
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for the current field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Check if the field is part of the address object
    if (['street', 'city', 'state', 'zipCode', 'country'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value 
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation if provided
    if (formData.phone && !/^[\d\s+\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format phone number - remove all non-digit characters except leading +
      const formattedPhone = formData.phone 
        ? formData.phone.replace(/[^\d+]/g, '')
        : '';
      
      // Format date to ISO string if provided
      const formattedDateOfBirth = formData.dateOfBirth 
        ? new Date(formData.dateOfBirth).toISOString()
        : undefined;
      
      // Prepare the data for the API in the format expected by the backend
      const clientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email ? formData.email.trim().toLowerCase() : undefined,
        phone: formattedPhone || undefined,
        dateOfBirth: formattedDateOfBirth,
        occupation: formData.occupation ? formData.occupation.trim() : undefined,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim(),
          country: formData.address.country.trim()
        },
        notes: formData.notes ? formData.notes.trim() : undefined
      };
      
      console.log('Sending client data:', JSON.stringify(clientData, null, 2));
      
      // Make the API call with error handling
      const response = await api.post('/clients', clientData, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        // Show success message
        toast.success('Client created successfully!');
        
        // Redirect to clients page after a short delay
        setTimeout(() => {
          navigate('/clients');
        }, 1000);
      } else if (response.status === 400 && response.data?.errors) {
        // Handle validation errors from server
        const serverErrors = {};
        response.data.errors.forEach(error => {
          const field = error.path;
          if (field) {
            serverErrors[field] = error.msg;
          }
        });
        setErrors(serverErrors);
      } else {
        // Handle other API errors
        const errorMessage = response.data?.message || 'Failed to create client. Please check your input.';
        toast.error(errorMessage);
      }
      
    } catch (error) {
      console.error('Error creating client:', error);
      
      // Show detailed error message to user
      let errorMessage = 'Failed to create client. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        errorMessage = error.response.data?.message || 
                     `Server responded with status: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get error message for a field
  const getError = (fieldName) => {
    return errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  return (
    <Layout>
      <div className="p-8 bg-white min-h-screen">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/clients')} 
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} /> Back to Clients
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-1">Add New Client</h1>
        <p className="text-gray-500 mb-6">Create a new client record</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <User size={20} /> 
                <h2 className="font-semibold text-lg">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required 
                  />
                  {getError('firstName')}
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required 
                  />
                  {getError('lastName')}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('email')}
                <p className="text-xs text-gray-400 mt-1">Email address is optional</p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getError('phone')}
                <p className="text-xs text-gray-400 mt-1">e.g., +1 (555) 123-4567</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date of Birth</label>
                  <input 
                    type="date" 
                    name="dateOfBirth" 
                    value={formData.dateOfBirth} 
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-lg px-3 py-2" 
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Occupation</label>
                  <input 
                    type="text" 
                    name="occupation" 
                    value={formData.occupation} 
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Lead">Lead</option>
                    <option value="Former Client">Former Client</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} /> 
                <h2 className="font-semibold text-lg">Address Information</h2>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium">Street Address</label>
                <input 
                  type="text" 
                  name="street" 
                  value={formData.address.street} 
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.address.city} 
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State/Province</label>
                  <input 
                    type="text" 
                    name="state" 
                    value={formData.address.state} 
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">ZIP/Postal Code</label>
                  <input 
                    type="text" 
                    name="postalCode" 
                    value={formData.address.postalCode} 
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <select
                    name="country" 
                    value={formData.address.country} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select a country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} /> 
              <h2 className="font-semibold text-lg">Additional Notes</h2>
            </div>


            <label className="text-sm font-medium">Client Notes</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2" 
              rows="4"
              placeholder="Add any relevant notes about the client, case details, preferences, or other important information..." 
            />
            
            <p className="text-xs text-gray-400 mt-2">
              Include any relevant information such as referral source, case type, communication preferences, etc.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/clients')} 
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating...
                </>
              ) : (
                'Create Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddClient;
