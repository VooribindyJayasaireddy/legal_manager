import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Using useNavigate from react-router-dom

// Define types for form data and errors
interface FormData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    general?: string;
}

// Define types for successful API response (matches User type in App.tsx)
interface AuthSuccessResponse {
    message: string;
    _id: string;
    username: string;
    email: string;
    firstName?: string; // Optional
    lastName?: string;  // Optional
    token: string;
}

// RegisterPage component props
interface RegisterPageProps {
    onAuthSuccess: (userData: AuthSuccessResponse) => void; // Callback after successful authentication
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onAuthSuccess }) => {
    const navigate = useNavigate(); // Hook for navigation

    // State to manage form input values, explicitly typed
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: ''
    });

    // State to manage validation errors, explicitly typed
    const [errors, setErrors] = useState<FormErrors>({});

    // State for loading indicator during API call
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // State for general messages (success or error)
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Function to handle input changes with explicit event type
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Clear error and general message for the current field as user types
        if (errors[name as keyof FormErrors]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: '',
            }));
        }
        setMessage(''); // Clear general messages on input change
        setMessageType('');
    };

    // Function to validate form data (client-side)
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (formData.phoneNumber && !/^[0-9]{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Function to handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Clear previous messages and errors
        setMessage('');
        setMessageType('');
        setErrors({});

        if (!validateForm()) {
            setMessage('Please correct the highlighted errors.');
            setMessageType('error');
            return; // Stop submission if client-side validation fails
        }

        setIsLoading(true); // Set loading state
        try {
            const apiUrl = 'http://localhost:5000/api/auth/register'; // Your backend registration endpoint

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber || undefined,
                }),
            });

            const data: AuthSuccessResponse | { errors?: FormErrors; message?: string } = await response.json(); // Always parse response as JSON

            if (response.ok) { // Check if response status is 2xx
                const successData = data as AuthSuccessResponse;
                setMessage('Registration successful! Redirecting...');
                setMessageType('success');
                console.log('Registration successful:', successData);
                onAuthSuccess(successData); // Pass success data to parent (App.tsx)
            } else {
                // Handle API errors (e.g., 400 Bad Request, 409 Conflict, 500 Internal Server Error)
                if ('errors' in data && data.errors) {
                    setErrors(data.errors);
                    setMessage('Please correct the form errors.');
                    setMessageType('error');
                } else if ('message' in data && data.message) {
                    setMessage(data.message);
                    setMessageType('error');
                } else {
                    setMessage('An unexpected error occurred during registration. Please try again.');
                    setMessageType('error');
                }
                console.error('Failed to register:', response.status, data);
            }
        } catch (error) {
            console.error('Network or unexpected error during registration:', error);
            setMessage('Failed to connect to the server. Please check your internet connection and try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false); // Clear loading state
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                {/* User icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                        </svg>
                    </div>
                </div>

                {/* Header text */}
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Your Account</h1>
                <p className="text-center text-gray-600 mb-8">Join our community and start your journey</p>

                {/* Account Details section */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-2">
                            1
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
                        <div className="flex-grow h-1 bg-gray-200 rounded ml-4">
                            <div className="w-1/2 h-full bg-blue-500 rounded"></div> {/* Progress bar */}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Display general messages (success/error) */}
                        {message && (
                            <div
                                className={`p-3 mb-4 rounded-lg text-center text-sm ${
                                    messageType === 'success'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}
                                role="alert"
                            >
                                {message}
                            </div>
                        )}

                        {/* Username field */}
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                                Username<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Choose a unique username"
                                    className={`shadow appearance-none border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10`}
                                    aria-describedby="username-description username-error"
                                />
                                {formData.username.length >= 3 && !errors.username && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            ></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <p id="username-description" className="text-gray-600 text-xs mt-1">
                                Minimum 3 characters
                            </p>
                            {errors.username && (
                                <p id="username-error" className="text-red-500 text-xs italic mt-1">
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        {/* Email Address field */}
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                                Email Address<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={`shadow appearance-none border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10`}
                                    aria-describedby="email-description email-error"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    {/* Email icon */}
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                    </svg>
                                </div>
                            </div>
                            <p id="email-description" className="text-gray-600 text-xs mt-1">
                                We'll never share your email
                            </p>
                            {errors.email && (
                                <p id="email-error" className="text-red-500 text-xs italic mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                                Password<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`shadow appearance-none border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 mb-1 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10`}
                                    aria-describedby="password-description password-error"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                                    {/* Eye icon - static for now, but can be made interactive to toggle password visibility */}
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                        <path
                                            fillRule="evenodd"
                                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                            clipRule="evenodd"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <p id="password-description" className="text-gray-600 text-xs mt-1">
                                Minimum 6 characters
                            </p>
                            {errors.password && (
                                <p id="password-error" className="text-red-500 text-xs italic mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* First Name and Last Name fields (optional) */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-1">
                                <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Phone Number field */}
                        <div className="mb-6">
                            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">
                                Phone Number (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => {
                                        // Only allow numbers and up to 10 digits
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData({ ...formData, phoneNumber: value });
                                    }}
                                    placeholder="1234567890"
                                    className={`shadow appearance-none border ${
                                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    aria-describedby="phoneNumber-description phoneNumber-error"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                                    </svg>
                                </div>
                            </div>
                            <p id="phoneNumber-description" className="text-gray-600 text-xs mt-1">
                                10-digit number (optional)
                            </p>
                            {errors.phoneNumber && (
                                <p id="phoneNumber-error" className="text-red-500 text-xs italic mt-1">
                                    {errors.phoneNumber}
                                </p>
                            )}
                        </div>

                        {/* Create Account button */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading} // Disable button while loading
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* Already have an account? Sign in */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    Already have an account?{' '}
                    <a href="#" onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold">
                        Sign in
                    </a>
                </p>

                {/* Terms of Service and Privacy Policy */}
                <p className="text-center text-gray-500 text-xs mt-8">
                    By creating an account, you agree to our{' '}
                    <a href="javascript:void(0);" className="text-blue-600 hover:underline">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="javascript:void(0);" className="text-blue-600 hover:underline">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
