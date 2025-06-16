import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Using useNavigate from react-router-dom

// Define types for login form data
interface LoginFormInputs {
    email: string;
    password: string;
}

// Define types for login errors
interface LoginErrors {
    email?: string;
    password?: string;
    general?: string; // For general server-side errors
}

// Define types for successful API response (matches User type in App.tsx)
interface AuthSuccessResponse {
    message: string;
    _id: string;
    username: string;
    email: string;
    firstName?: string; // Optional
    lastName?: string;   // Optional
    token: string;
}

// LoginPage component props
interface LoginPageProps {
    onAuthSuccess: (userData: AuthSuccessResponse) => void; // Callback after successful authentication
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
    const navigate = useNavigate(); // Hook for navigation

    // State for form input values
    const [formData, setFormData] = useState<LoginFormInputs>({
        email: '',
        password: '',
    });

    // State for validation errors
    const [errors, setErrors] = useState<LoginErrors>({});

    // State for loading indicator during API call
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // State for general messages (success or error)
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Handles input changes and clears associated errors
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Clear specific error for the field being typed into
        if (errors[name as keyof LoginErrors]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: '',
            }));
        }
        // Clear general messages on input change
        setMessage('');
        setMessageType('');
    };

    // Client-side form validation
    const validateForm = (): boolean => {
        const newErrors: LoginErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email address is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address format.';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Returns true if no errors
    };

    // Handles form submission, including API call
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default browser form submission

        // Clear previous messages and errors
        setMessage('');
        setMessageType('');
        setErrors({});

        if (!validateForm()) {
            setMessage('Please correct the highlighted errors.');
        setMessageType('error');
        return; // Stop if client-side validation fails
    }

    setIsLoading(true); // Start loading
    try {
        const apiUrl = 'http://localhost:5000/api/auth/login'; // Your backend login endpoint

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
        });

        const data: AuthSuccessResponse | { errors?: LoginErrors; message?: string } = await response.json(); // Parse the response JSON

        if (response.ok) {
            const successData = data as AuthSuccessResponse; // Type assertion for success
            setMessage('Login successful! Redirecting to dashboard...');
            setMessageType('success');
            console.log('Login successful:', successData);
            onAuthSuccess(successData); // Pass success data to parent (App.tsx)
        } else {
            // Handle API errors (e.g., 401 Unauthorized, 400 Bad Request)
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
            console.error('Failed to log in:', response.status, data);
        }
    } catch (error) {
        console.error('Network or unexpected error:', error);
        setMessage('Failed to connect to the server. Please check your internet connection and try again.');
        setMessageType('error');
    } finally {
        setIsLoading(false); // Clear loading state
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-inter bg-gray-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
                {/* Sign In Form */}
                <div className="p-6 sm:p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800">Sign In</h1>
                        <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
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

                        {/* Email Address field */}
                        <div className="mb-5">
                            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={`shadow appearance-none border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs italic mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`shadow appearance-none border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10`}
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
                            {errors.password && (
                                <p className="text-red-500 text-xs italic mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember me and Forgot Password */}
                        <div className="flex items-center justify-between mb-6 text-sm">
                            <label className="flex items-center text-gray-600">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                <span className="ml-2">Remember me</span>
                            </label>
                            <a href="#" className="text-blue-600 hover:underline font-medium">
                                Forgot Password?
                            </a>
                        </div>

                        {/* Sign In button */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Don't have an account? Create Account */}
                    <p className="text-center text-gray-600 text-sm mt-6">
                        Don't have an account?{' '}
                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/register');}} className="text-blue-600 hover:underline font-medium">
                            Create Account
                        </a>
                    </p>

                    {/* Footer Links */}
                    <div className="text-center text-gray-400 text-xs mt-8 pt-6 border-t border-gray-100">
                        <div className="flex flex-wrap justify-center gap-3">
                            <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-gray-600 transition-colors">Help Center</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

