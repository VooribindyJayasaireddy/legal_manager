import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // To access state passed from other pages

// Define Client type for dropdown selection
interface ClientOption {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

// Define Case type for dropdown selection
interface CaseOption {
    _id: string;
    caseName: string;
    caseNumber?: string;
}

// Attendee type for form input
interface AttendeeInput {
    name: string;
    email: string;
    phone: string;
    role: string;
}

// Appointment Form Inputs
interface AppointmentFormInputs {
    title: string;
    description: string;
    clientId: string;
    caseId: string;
    startTime: string; // YYYY-MM-DDTHH:MM format
    endTime: string;   // YYYY-MM-DDTHH:MM format
    location: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    reminderSent: boolean;
}

interface AppointmentFormErrors {
    title?: string;
    description?: string;
    clientId?: string;
    caseId?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    status?: string;
    attendees?: string; // For general attendees error
    general?: string;
}

interface AddAppointmentPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const AddAppointmentPage: React.FC<AddAppointmentPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const location = useLocation(); // Hook to access route state
    // Pre-populate fields if navigating from CaseDetailsPage (e.g., to "Schedule Meeting")
    const preselectCaseId = (location.state as any)?.preselectCaseId || '';

    // Initialize form data with default values
    const [formData, setFormData] = useState<AppointmentFormInputs>(() => {
        const savedData = localStorage.getItem('appointmentFormData');
        if (savedData) {
            return JSON.parse(savedData);
        }
        const now = new Date();
        const start = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        const end = new Date(now.getTime() + 60 * 60 * 1000 - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        return {
            title: '',
            description: '',
            clientId: '',
            caseId: preselectCaseId,
            startTime: start,
            endTime: end,
            location: '',
            status: 'scheduled' as const,
            reminderSent: false,
        };
    });
    const [attendees, setAttendees] = useState<AttendeeInput[]>([]);
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);

    const [errors, setErrors] = useState<AppointmentFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false); // For form submission
    const [loadingAssociations, setLoadingAssociations] = useState<boolean>(true); // For fetching clients/cases

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Set default start and end times on mount
    // Set default times only if they're not already set
    useEffect(() => {
        if (!formData.startTime || !formData.endTime) {
            const now = new Date();
            const start = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            const end = new Date(now.getTime() + 60 * 60 * 1000 - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

            setFormData(prev => ({
                ...prev,
                startTime: start,
                endTime: end,
            }));
        }
    }, []);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('appointmentFormData', JSON.stringify(formData));
    }, [formData]);

    // Fetch available clients and cases for dropdowns
    const fetchAssociations = useCallback(async () => {
        setLoadingAssociations(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                setLoadingAssociations(false);
                return;
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
            if (clientsResponse.ok) {
                setAvailableClients(await clientsResponse.json());
            } else {
                console.error('Failed to fetch clients:', clientsResponse.status);
                setMessage('Failed to load clients for association.');
                setMessageType('error');
            }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
            if (casesResponse.ok) {
                setAvailableCases(await casesResponse.json());
            } else {
                console.error('Failed to fetch cases:', casesResponse.status);
                setMessage('Failed to load cases for association.');
                setMessageType('error');
            }

        } catch (error) {
            console.error('Network error fetching associations:', error);
            setMessage('Network error while loading associated data.');
            setMessageType('error');
        } finally {
            setLoadingAssociations(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchAssociations();
    }, [fetchAssociations]);


   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
       const target = e.target as HTMLInputElement; // Type assertion
       const { name, value, type } = target;
       
       setFormData(prev => ({
           ...prev,
           [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
       }));
   
       if (errors[name as keyof AppointmentFormErrors]) { 
           setErrors(prev => ({ ...prev, [name]: '' })); 
       }
       setMessage('');
       setMessageType('');
   };

    const handleAttendeeChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newAttendees = [...attendees];
        newAttendees[index] = { ...newAttendees[index], [name]: value };
        setAttendees(newAttendees);
    };

    const addAttendee = () => {
        setAttendees(prev => [...prev, { name: '', email: '', phone: '', role: '' }]);
    };

    const removeAttendee = (index: number) => {
        setAttendees(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        const newErrors: AppointmentFormErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.startTime) newErrors.startTime = 'Start Time is required.';
        if (!formData.endTime) newErrors.endTime = 'End Time is required.';
        if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
            newErrors.endTime = 'End Time must be after Start Time.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const userId = localStorage.getItem('userId');
            if (!token || !userId) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            const apiUrl = 'http://localhost:5000/api/appointments'; // Endpoint to create a new appointment
            const appointmentDataToSend = {
                user: userId,
                title: formData.title,
                description: formData.description || undefined,
                client: formData.clientId || undefined,
                case: formData.caseId || undefined,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                location: formData.location || undefined,
                attendees: attendees.filter(att => att.name.trim() || att.email.trim()), // Only send non-empty attendees
                status: formData.status,
                reminderSent: formData.reminderSent,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(appointmentDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Appointment created successfully!');
                setMessageType('success');
                console.log('Appointment created:', data);
                // Clear form after success
                setFormData({
                    title: '', description: '', clientId: '', caseId: '', startTime: '', endTime: '',
                    location: '', status: 'scheduled', reminderSent: false,
                });
                setAttendees([]);
                onSuccess(data.message || 'Appointment created successfully!'); // Notify parent
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('Unexpected error creating appointment. Try again.'); setMessageType('error'); }
            }
        } catch (error) {
            console.error('Network or unexpected error creating appointment:', error);
            setMessage('Failed to connect to server. Check connection.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingAssociations) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading associated data for form...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">New Appointment</h1>
                <p className="text-center text-gray-600 mb-8">Schedule a new meeting or event.</p>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <div className={`p-3 mb-4 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Basic Information Column */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                            {/* Title */}
                            <div className="mb-4">
                                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title<span className="text-red-500">*</span></label>
                                <input
                                    type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter appointment title"
                                    className={`shadow appearance-none border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
                            </div>
                            {/* Description */}
                            <div className="mb-4">
                                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
                                <textarea
                                    id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter appointment description"
                                    rows={3}
                                    className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                ></textarea>
                            </div>
                            {/* Status */}
                            <div className="mb-4">
                                <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status<span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        id="status" name="status" value={formData.status} onChange={handleInputChange}
                                        className={`block appearance-none w-full bg-white border ${errors.status ? 'border-red-500' : 'border-gray-300'} text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500`}
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="rescheduled">Rescheduled</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                    </div>
                                </div>
                                {errors.status && <p className="text-red-500 text-xs italic mt-1">{errors.status}</p>}
                            </div>
                            {/* Location */}
                            <div className="mb-4">
                                <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location (Optional)</label>
                                <input
                                    type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="Enter location"
                                    className="shadow appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Related Information & Attendees Column */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Related Information</h3>
                            {/* Client Association */}
                            <div className="mb-4">
                                <label htmlFor="clientId" className="block text-gray-700 text-sm font-bold mb-2">Client (Optional)</label>
                                <select
                                    id="clientId" name="clientId" value={formData.clientId} onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="">-- Select a Client --</option>
                                    {availableClients.map(c => (
                                        <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            {/* Case Association */}
                            <div className="mb-4">
                                <label htmlFor="caseId" className="block text-gray-700 text-sm font-bold mb-2">Case (Optional)</label>
                                <select
                                    id="caseId" name="caseId" value={formData.caseId} onChange={handleInputChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="">-- Select a Case --</option>
                                    {availableCases.map(c => (
                                        <option key={c._id} value={c._id}>{c.caseName} ({c.caseNumber})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Attendees Section */}
                            <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-6 flex justify-between items-center">
                                Attendees
                                <button type="button" onClick={addAttendee} className="flex items-center text-blue-600 text-sm font-semibold hover:underline">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    Add Attendee
                                </button>
                            </h4>
                            {attendees.length === 0 && <p className="text-gray-600 text-sm">No attendees added yet.</p>}
                            {attendees.map((attendee, index) => (
                                <div key={index} className="grid grid-cols-4 gap-2 mb-2 p-2 border rounded-lg bg-gray-50 items-end">
                                    <div className="col-span-2">
                                        <label htmlFor={`attendee-name-${index}`} className="block text-gray-700 text-xs font-bold mb-1">Name</label>
                                        <input
                                            type="text" id={`attendee-name-${index}`} name="name" value={attendee.name} onChange={(e) => handleAttendeeChange(index, e)} placeholder="Name"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-1.5 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor={`attendee-email-${index}`} className="block text-gray-700 text-xs font-bold mb-1">Email</label>
                                        <input
                                            type="email" id={`attendee-email-${index}`} name="email" value={attendee.email} onChange={(e) => handleAttendeeChange(index, e)} placeholder="Email"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-1.5 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor={`attendee-phone-${index}`} className="block text-gray-700 text-xs font-bold mb-1">Phone</label>
                                        <input
                                            type="tel" id={`attendee-phone-${index}`} name="phone" value={attendee.phone} onChange={(e) => handleAttendeeChange(index, e)} placeholder="Phone"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-1.5 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label htmlFor={`attendee-role-${index}`} className="block text-gray-700 text-xs font-bold mb-1">Role</label>
                                        <input
                                            type="text" id={`attendee-role-${index}`} name="role" value={attendee.role} onChange={(e) => handleAttendeeChange(index, e)} placeholder="Role"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-1.5 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end items-end">
                                        <button type="button" onClick={() => removeAttendee(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time & Date Column */}
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Time & Date</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Start Time */}
                            <div>
                                <label htmlFor="startTime" className="block text-gray-700 text-sm font-bold mb-2">Start Time<span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local" id="startTime" name="startTime" value={formData.startTime} onChange={handleInputChange}
                                    className={`shadow appearance-none border ${errors.startTime ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {errors.startTime && <p className="text-red-500 text-xs italic mt-1">{errors.startTime}</p>}
                            </div>
                            {/* End Time */}
                            <div>
                                <label htmlFor="endTime" className="block text-gray-700 text-sm font-bold mb-2">End Time<span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local" id="endTime" name="endTime" value={formData.endTime} onChange={handleInputChange}
                                    className={`shadow appearance-none border ${errors.endTime ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {errors.endTime && <p className="text-red-500 text-xs italic mt-1">{errors.endTime}</p>}
                            </div>
                        </div>
                        {/* Send Reminder Toggle */}
                        <div className="mb-6 flex items-center">
                            <input
                                type="checkbox" id="reminderSent" name="reminderSent" checked={formData.reminderSent} onChange={handleInputChange}
                                className="form-checkbox h-5 w-5 text-blue-600 rounded"
                            />
                            <label htmlFor="reminderSent" className="ml-2 text-gray-700 text-sm font-bold">Send Reminder</label>
                        </div>
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
                            {isLoading ? 'Creating Appointment...' : 'Create Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAppointmentPage;
