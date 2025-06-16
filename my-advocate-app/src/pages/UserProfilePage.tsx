import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XMarkIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants for the text
const textVariants = {
  hidden: { 
    opacity: 0,
    x: -20,
    transition: { duration: 0.3 }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.3 }
  }
} as const;

// Animation for the door icon
const doorVariants = {
  initial: { x: 0 },
  animate: {
    x: [0, 5, -5, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop' as const
    }
  }
} as const;

// Inline SVG components for the door and person
const DoorIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 19H3V5h7V3H3c-1.104 0-2 .896-2 2v14c0 1.104.896 2 2 2h7v-2zm2-16v18h2V3h-2zm-6 8v-2h2v2H6zm2 2v-2h2v2H8zM6 15v-2h2v2H6z"/>
  </svg>
);

const PersonIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6.17l-1.59-1.59L12 5.03l-1.24 1.24L9.17 9H3v2h2v10h14V11h2V9z"/>
  </svg>
);

// Define UserProfile data type based on backend response
interface UserProfile {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    createdAt: string;
    updatedAt: string;
}

// UserProfile form input structure
interface UserProfileFormInputs {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phoneNumber: string;
}

// UserProfile form errors
interface UserProfileFormErrors {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    general?: string;
}

// User type based on the one in App.tsx
interface User {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    token: string;
}

interface UserProfilePageProps {
    onLogout: () => void;
    userId: string;
    onProfileUpdated: (updatedUser: User) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onLogout, userId, onProfileUpdated }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<UserProfileFormInputs>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: ''
    });
    const [errors, setErrors] = useState<UserProfileFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up timeouts on unmount
    useEffect(() => {
        const timeoutRef = animationTimeoutRef.current;
        return (): void => {
            if (timeoutRef) {
                clearTimeout(timeoutRef);
            }
        };
    }, []);

    const fetchUserProfile = useCallback(async () => {
        setIsLoading(true);
        setMessage('');
        setMessageType('');
        setErrors({});

        // Try to get user data from localStorage first
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
            try {
                const userData = JSON.parse(savedUserData);
                if (userData && (userData.username || userData.email)) {
                    setFormData({
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        username: userData.username || '',
                        email: userData.email || '',
                        phoneNumber: userData.phoneNumber || ''
                    });
                }
            } catch (e) {
                console.error('Error parsing saved user data:', e);
            }
        }

        // Then try to fetch fresh data from the server
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication token not found. Please log in again.');
                setMessageType('error');
                onLogout();
                return;
            }

            const response = await fetch('http://localhost:5000/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data: UserProfile = await response.json();
                const updatedFormData = {
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    username: data.username || '',
                    email: data.email || '',
                    phoneNumber: data.phoneNumber || ''
                };
                setFormData(updatedFormData);
                localStorage.setItem('userData', JSON.stringify(updatedFormData));
            } else if (response.status === 404) {
                setMessage('User profile not found.');
                setMessageType('error');
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                onLogout();
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || 'Failed to fetch user profile');
                setMessageType('error');
                console.error('Failed to fetch user profile:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching user profile:', err);
            if (!savedUserData) {
                setMessage('Failed to connect to the server. Using cached data if available.');
                setMessageType('error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            localStorage.setItem('userData', JSON.stringify(newData));
            return newData;
        });
        if (errors[name as keyof UserProfileFormErrors]) { 
            setErrors(prev => ({ ...prev, [name]: '' })); 
        }
        setMessage('');
        setMessageType('');
    };

    const validateForm = (): boolean => {
        const newErrors: UserProfileFormErrors = {};
        let isValid = true;

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
            isValid = false;
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
            isValid = false;
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            isValid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
            isValid = false;
        }

        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Phone number is required';
            isValid = false;
        } else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

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

        // Format phone number
        const formattedPhone = formData.phoneNumber.replace(/\D/g, '');
        const updatedFormData = { ...formData, phoneNumber: formattedPhone };
        
        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedFormData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            // Update form data with server response
            setFormData(prev => ({
                ...prev,
                ...data,
                phoneNumber: data.phoneNumber || ''
            }));

            // Update localStorage
            localStorage.setItem('userData', JSON.stringify({
                ...formData,
                ...data
            }));

            // Notify parent component
            onProfileUpdated({
                _id: data._id,
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                token: token
            });

            setMessage('Profile updated successfully!');
            setMessageType('success');

            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setMessage('');
                setMessageType('');
            }, 5000);

        } catch (err) {
            console.error('Error updating profile:', err);
            setMessage(err instanceof Error ? err.message : 'An error occurred while updating your profile');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnimatedLogout = () => {
        if (isAnimating || isLoggingOut) return;
        
        setIsAnimating(true);
        setIsLoggingOut(true);
        
        // Start the logout process after animation completes
        animationTimeoutRef.current = setTimeout(() => {
            onLogout();
            navigate('/login');
        }, 800); // Match this with the animation duration
    };

    // Notification component
    const Notification = () => {
        if (!message) return null;

        const isSuccess = messageType === 'success';
        const isError = messageType === 'error';
        const isInfo = !isSuccess && !isError;
        
        return (
            <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
                <Transition
                    show={!!message}
                    enter="transform ease-out duration-300 transition"
                    enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                    enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className={`rounded-md p-4 ${
                        isSuccess ? 'bg-green-50' : 
                        isError ? 'bg-red-50' : 
                        'bg-blue-50'
                    }`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {isSuccess ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                                ) : isError ? (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                ) : (
                                    <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                )}
                            </div>
                            <div className="ml-3">
                                <p className={`text-sm font-medium ${
                                    isSuccess ? 'text-green-800' : 
                                    isError ? 'text-red-800' : 
                                    'text-blue-800'
                                }`}>
                                    {message}
                                </p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setMessage('')}
                                        className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            isSuccess ? 'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600' :
                                            isError ? 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600' :
                                            'bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-offset-blue-50 focus:ring-blue-600'
                                        }`}
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        );
    };

    if (isLoading && !formData.username) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <Notification />
            
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">User Profile</h1>
                <p className="text-center text-gray-600 mb-8">View and update your personal information.</p>

                <form onSubmit={handleSubmit}>
                    {/* Inline message for form validation */}
                    {message && messageType === 'error' && (
                        <div className="p-3 mb-4 rounded-lg text-center text-sm bg-red-100 text-red-700" role="alert">
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                First Name *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.firstName && (
                                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.lastName && (
                                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username *
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                    errors.username ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                    // Only allow numbers and limit to 10 digits
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    handleInputChange({
                                        ...e,
                                        target: {
                                            ...e.target,
                                            name: 'phoneNumber',
                                            value
                                        }
                                    });
                                }}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="1234567890"
                                disabled={isLoading}
                            />
                            {errors.phoneNumber && (
                                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-150"
                            disabled={isLoading}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={handleAnimatedLogout}
                            disabled={isLoggingOut || isAnimating}
                            className="relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden bg-blue-500 hover:bg-blue-600 disabled:bg-blue-600"
                            style={{
                                minWidth: '120px',
                                height: '40px'
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {!isAnimating ? (
                                    <motion.div 
                                        key="logout"
                                        className="flex items-center gap-1.5"
                                        initial={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <span className="text-sm">Log Out</span>
                                        <motion.div
                                            animate={{
                                                x: [0, 2, 0],
                                                transition: {
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }
                                            }}
                                        >
                                            <DoorIcon className="w-3.5 h-3.5 text-blue-100" />
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="logging-out"
                                        className="flex items-center gap-1.5"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <span className="text-sm">Logging Out</span>
                                        <motion.span
                                            className="inline-block"
                                            animate={{ 
                                                opacity: [0.5, 1, 0.5],
                                                transition: {
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }
                                            }}
                                        >
                                            ...
                                        </motion.span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {/* Progress bar */}
                            <motion.div 
                                className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
                                initial={{ width: 0 }}
                                animate={{
                                    width: isAnimating ? '100%' : '0%',
                                    transition: { 
                                        duration: 2,
                                        ease: "linear"
                                    }
                                }}
                            />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfilePage;
