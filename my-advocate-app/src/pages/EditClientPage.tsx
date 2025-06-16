import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Define types for Client data (same as in other client-related files)
interface Client {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    dateOfBirth?: string;
    occupation?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Define types for Client Form Inputs (same as in AddClientPage)
interface ClientFormInputs {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    dateOfBirth: string; // Format: YYYY-MM-DD for input type="date"
    occupation: string;
    notes: string;
}

// Define types for form errors (same as in AddClientPage)
interface ClientFormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    dateOfBirth?: string;
    occupation?: string;
    notes?: string;
    general?: string;
}

interface EditClientPageProps {
    onBackToList: () => void; // Prop to navigate back to the client list
    onSuccess: (message: string) => void; // Prop to notify parent of success
    onLogout: () => void; // Prop to handle logout if authentication fails
}

const EditClientPage: React.FC<EditClientPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get client ID from URL

    // State for form input values
    const [formData, setFormData] = useState<ClientFormInputs>({
        firstName: '', lastName: '', email: '', phone: '',
        address: { street: '', city: '', state: '', zipCode: '', country: '' },
        dateOfBirth: '', occupation: '', notes: ''
    });

    // State for validation errors
    const [errors, setErrors] = useState<ClientFormErrors>({});

    // State for loading indicator (for fetching client data AND form submission)
    const [isLoading, setIsLoading] = useState<boolean>(true); // Starts true to fetch initial data

    // State for general messages (success or error)
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fetch client data to pre-populate the form
    useEffect(() => {
        const fetchClientData = async () => {
            if (!id) {
                setMessage('Client ID not provided for editing.');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setErrors({});
            setMessage('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setMessage('Authentication token not found. Please log in again.');
                    setMessageType('error');
                    onLogout();
                    return;
                }

                const apiUrl = `http://localhost:5000/api/clients/${id}`;
                const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data: Client = await response.json();
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        address: {
                            street: data.address?.street || '',
                            city: data.address?.city || '',
                            state: data.address?.state || '',
                            zipCode: data.address?.zipCode || '',
                            country: data.address?.country || '',
                        },
                        // Format date to YYYY-MM-DD for input type="date"
                        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
                        occupation: data.occupation || '',
                        notes: data.notes || '',
                    });
                } else if (response.status === 401 || response.status === 403) {
                    setMessage('Session expired or unauthorized. Please log in again.');
                    setMessageType('error');
                    onLogout();
                } else {
                    const errorData = await response.json();
                    setMessage(errorData.message || 'Failed to fetch client data for editing.');
                    setMessageType('error');
                    console.error('Failed to fetch client for edit:', response.status, errorData);
                }
            } catch (error) {
                console.error('Network or unexpected error fetching client for edit:', error);
                setMessage('Failed to connect to the server or unexpected error.');
                setMessageType('error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClientData();
    }, [id, onLogout]);


    // Handles changes to form inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Handle nested address fields
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1] as keyof ClientFormInputs['address'];
            setFormData((prevData) => ({
                ...prevData,
                address: {
                    ...prevData.address,
                    [addressField]: value,
                },
            }));
            // Clear address sub-field error
            setErrors((prevErrors) => ({
                ...prevErrors,
                address: prevErrors.address ? { ...prevErrors.address, [addressField]: '' } : undefined,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
            // Clear general error for the field being typed into
            if (errors[name as keyof ClientFormErrors]) {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    [name]: '',
                }));
            }
        }
        setMessage(''); // Clear general messages on input change
        setMessageType('');
    };

    // Client-side form validation
    const validateForm = (): boolean => {
        const newErrors: ClientFormErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First Name is required.';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last Name is required.';
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address format.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && (!newErrors.address || Object.keys(newErrors.address).length === 0);
    };

    // Handles form submission (Update operation)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setMessage('');
        setMessageType('');
        setErrors({});

        if (!validateForm()) {
            setMessage('Please correct the highlighted errors.');
            setMessageType('error');
            return;
        }

        setIsLoading(true); // Set loading state for submission
        try {
            const token = localStorage.getItem('authToken');
            const userId = localStorage.getItem('userId'); // Assuming userId is needed for ownership
            if (!token || !userId) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            const apiUrl = `http://localhost:5000/api/clients/${id}`; // Specific URL for PUT
            const clientDataToSend = {
                // user: userId, // User reference might not be sent on update, depends on backend
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                address: (formData.address.street || formData.address.city || formData.address.state || formData.address.zipCode || formData.address.country)
                    ? formData.address : undefined,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
                occupation: formData.occupation || undefined,
                notes: formData.notes || undefined,
            };

            const response = await fetch(apiUrl, {
                method: 'PUT', // Use PUT for updating
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(clientDataToSend),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Client updated successfully!');
                setMessageType('success');
                console.log('Client updated:', data);
                onSuccess(data.message || 'Client updated successfully!'); // Notify parent of success
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else {
                if ('errors' in data && data.errors) {
                    setErrors(data.errors);
                    setMessage('Please correct the form errors.');
                    setMessageType('error');
                } else if ('message' in data && data.message) {
                    setMessage(data.message);
                    setMessageType('error');
                } else {
                    setMessage('An unexpected error occurred. Please try again.');
                    setMessageType('error');
                }
                console.error('Failed to update client:', response.status, data);
            }
        } catch (error) {
            console.error('Network or unexpected error during client update:', error);
            setMessage('Failed to connect to the server. Please check your internet connection and try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading client data for edit...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Edit Client</h1>
                <p className="text-center text-gray-600 mb-8">Modify the client details below.</p>

                <form onSubmit={handleSubmit}>
                    {/* General Messages */}
                    {message && (
                        <div
                            className={`p-3 mb-4 rounded-lg text-center text-sm ${
                                messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                            role="alert"
                        >
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* First Name */}
                        <div>
                            <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">
                                First Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Enter first name"
                                className={`shadow appearance-none border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.firstName && <p className="text-red-500 text-xs italic mt-1">{errors.firstName}</p>}
                        </div>

                        {/* Last Name */}
                        <div>
                            <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">
                                Last Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Enter last name"
                                className={`shadow appearance-none border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.lastName && <p className="text-red-500 text-xs italic mt-1">{errors.lastName}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                className={`shadow appearance-none border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                                Phone
                            </label>
                            <input
                                type="tel" // Use tel for phone numbers
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label htmlFor="dateOfBirth" className="block text-gray-700 text-sm font-bold mb-2">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Occupation */}
                        <div>
                            <label htmlFor="occupation" className="block text-gray-700 text-sm font-bold mb-2">
                                Occupation
                            </label>
                            <input
                                type="text"
                                id="occupation"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                placeholder="Enter occupation"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-6">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Street */}
                        <div>
                            <label htmlFor="address.street" className="block text-gray-700 text-sm font-bold mb-2">
                                Street
                            </label>
                            <input
                                type="text"
                                id="address.street"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                                placeholder="Street address"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {/* City */}
                        <div>
                            <label htmlFor="address.city" className="block text-gray-700 text-sm font-bold mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                id="address.city"
                                name="address.city"
                                value={formData.address.city}
                                onChange={handleChange}
                                placeholder="City"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {/* State */}
                        <div>
                            <label htmlFor="address.state" className="block text-gray-700 text-sm font-bold mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                id="address.state"
                                name="address.state"
                                value={formData.address.state}
                                onChange={handleChange}
                                placeholder="State"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {/* Zip Code */}
                        <div>
                            <label htmlFor="address.zipCode" className="block text-gray-700 text-sm font-bold mb-2">
                                Zip Code
                            </label>
                            <input
                                type="text"
                                id="address.zipCode"
                                name="address.zipCode"
                                value={formData.address.zipCode}
                                onChange={handleChange}
                                placeholder="Zip Code"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {/* Country */}
                        <div className="md:col-span-2"> {/* Make country span two columns on medium screens */}
                            <label htmlFor="address.country" className="block text-gray-700 text-sm font-bold mb-2">
                                Country
                            </label>
                            <input
                                type="text"
                                id="address.country"
                                name="address.country"
                                value={formData.address.country}
                                onChange={handleChange}
                                placeholder="Country"
                                className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Add any additional notes about the client"
                            rows={4}
                            className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onBackToList}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-150"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating Client...' : 'Update Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientPage;
