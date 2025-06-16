import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Define types for Appointment data (from schema)
interface Appointment {
    _id: string;
    user: string;
    title: string;
    description?: string;
    client?: { _id: string; firstName: string; lastName: string; email?: string; phone?: string; };
    case?: { _id: string; caseName: string; caseNumber?: string; };
    startTime: string;
    endTime: string;
    location?: string;
    attendees: { name?: string; email?: string; phone?: string; role?: string }[];
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
}

// Attendee type for form input
interface AttendeeInput {
    name: string;
    email: string;
    phone: string;
    role: string;
}

// Appointment Form Inputs for editing
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
    attendees?: string;
    general?: string;
}

// Client type for dropdown selection
interface ClientOption {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

// Case type for dropdown selection
interface CaseOption {
    _id: string;
    caseName: string;
    caseNumber?: string;
}

interface EditAppointmentPageProps {
    onBackToList: () => void;
    onSuccess: (message: string) => void;
    onLogout: () => void;
}

const EditAppointmentPage: React.FC<EditAppointmentPageProps> = ({ onBackToList, onSuccess, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get appointment ID from URL

        // Initialize form data from localStorage or with defaults
    const getInitialFormData = (): AppointmentFormInputs => {
        if (typeof window === 'undefined') {
            return {
                title: '', description: '', clientId: '', caseId: '', startTime: '', endTime: '',
                location: '', status: 'scheduled', reminderSent: false,
            };
        }
        
        const savedData = localStorage.getItem('editAppointmentFormData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Ensure we have all required fields
                return {
                    title: parsedData.title || '',
                    description: parsedData.description || '',
                    clientId: parsedData.clientId || '',
                    caseId: parsedData.caseId || '',
                    startTime: parsedData.startTime || '',
                    endTime: parsedData.endTime || '',
                    location: parsedData.location || '',
                    status: parsedData.status || 'scheduled',
                    reminderSent: parsedData.reminderSent || false,
                };
            } catch (e) {
                console.error('Error parsing saved form data:', e);
            }
        }
        
        return {
            title: '', description: '', clientId: '', caseId: '', startTime: '', endTime: '',
            location: '', status: 'scheduled', reminderSent: false,
        };
    };

    const [formData, setFormData] = useState<AppointmentFormInputs>(getInitialFormData());
    const [attendees, setAttendees] = useState<AttendeeInput[]>(() => {
        if (typeof window === 'undefined') return [];
        const savedAttendees = localStorage.getItem('editAppointmentAttendees');
        return savedAttendees ? JSON.parse(savedAttendees) : [];
    });
    const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
    const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);

    const [errors, setErrors] = useState<AppointmentFormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial data fetch and form submission
    const [clientFetchError, setClientFetchError] = useState<string | null>(null); // For fetching associated data

    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fetch appointment data and associations to pre-populate the form
    const fetchDataForEdit = useCallback(async () => {
        if (!id) {
            setMessage('Appointment ID not provided for editing.');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrors({});
        setMessage('');
        setClientFetchError(null); // Clear previous errors

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                setIsLoading(false);
                return;
            }

            // Fetch Appointment Details
            const apptResponse = await fetch(`http://localhost:5000/api/appointments/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (apptResponse.ok) {
                const apptData: Appointment = await apptResponse.json();
                setFormData({
                    title: apptData.title || '',
                    description: apptData.description || '',
                    clientId: apptData.client?._id || '',
                    caseId: apptData.case?._id || '',
                    startTime: new Date(apptData.startTime).toISOString().slice(0, 16),
                    endTime: new Date(apptData.endTime).toISOString().slice(0, 16),
                    location: apptData.location || '',
                    status: apptData.status,
                    reminderSent: apptData.reminderSent,
                });

                
               // To this:
               setAttendees((apptData.attendees || []).map(attendee => ({
                   name: attendee.name || 'Unnamed Attendee', // Provide a default value
                   email: attendee.email || '',
                   phone: attendee.phone || '',
                   role: attendee.role || ''
               })));
            } else if (apptResponse.status === 404) {
                setMessage('Appointment not found.');
                setMessageType('error');
                setIsLoading(false);
                return;
            } else if (apptResponse.status === 401 || apptResponse.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
                setIsLoading(false);
                return;
            } else {
                const errorData = await apptResponse.json();
                setMessage(errorData.message || 'Failed to fetch appointment details.');
                setMessageType('error');
                console.error('Failed to fetch appointment details for edit:', apptResponse.status, errorData);
            }

            // Fetch Clients
            const clientsResponse = await fetch('http://localhost:5000/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
            if (clientsResponse.ok) {
                setAvailableClients(await clientsResponse.json());
            } else {
                console.error('Failed to fetch clients for association:', clientsResponse.status);
                setClientFetchError('Failed to load clients for association.');
            }

            // Fetch Cases
            const casesResponse = await fetch('http://localhost:5000/api/cases', { headers: { 'Authorization': `Bearer ${token}` } });
            if (casesResponse.ok) {
                setAvailableCases(await casesResponse.json());
            } else {
                console.error('Failed to fetch cases for association:', casesResponse.status);
                setClientFetchError('Failed to load cases for association.');
            }

        } catch (error) {
            console.error('Network error fetching appointment or associations:', error);
            setMessage('Network error while loading data for edit.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchDataForEdit();
    }, [fetchDataForEdit]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('editAppointmentFormData', JSON.stringify(formData));
        }
    }, [formData]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('editAppointmentAttendees', JSON.stringify(attendees));
        }
    }, [attendees]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement; // Type assertion
        const { name, value, type } = target;
        
        const newValue = type === 'checkbox' ? target.checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue,
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

        setIsLoading(true); // Set loading state for submission
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setMessage('Authentication required. Please log in.');
                setMessageType('error');
                onLogout();
                return;
            }

            const apiUrl = `http://localhost:5000/api/appointments/${id}`; // Endpoint for PUT request
            const appointmentDataToSend = {
                title: formData.title,
                description: formData.description || undefined,
                client: formData.clientId || undefined,
                case: formData.caseId || undefined,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                location: formData.location || undefined,
                attendees: attendees.filter(att => att.name.trim() || att.email.trim()),
                status: formData.status,
                reminderSent: formData.reminderSent,
            };

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(appointmentDataToSend),
            });

            const data = await response.json();
            if (response.ok) {
                // Clear saved form data on successful submission
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('editAppointmentFormData');
                    localStorage.removeItem('editAppointmentAttendees');
                }
                setMessage(data.message || 'Appointment updated successfully!');
                setMessageType('success');
                console.log('Appointment updated:', data);
                onSuccess(data.message || 'Appointment updated successfully!'); // Notify parent
            } else if (response.status === 401 || response.status === 403) {
                setMessage('Session expired or unauthorized. Please log in again.');
                setMessageType('error');
                onLogout();
            } else if (response.status === 404) {
                setMessage('Appointment not found for update.');
                setMessageType('error');
            } else {
                if ('errors' in data && data.errors) { setErrors(data.errors); setMessage('Please correct errors.'); setMessageType('error'); }
                else if ('message' in data && data.message) { setMessage(data.message); setMessageType('error'); }
                else { setMessage('An unexpected error occurred. Please try again.'); setMessageType('error'); }
            }
        } catch (error) {
            console.error('Network or unexpected error updating appointment:', error);
            setMessage('Failed to connect to the server. Check connection.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading appointment data for edit...</div>
            </div>
        );
    }

    if (!formData.title && !clientFetchError && !message) { // If no data loaded and no explicit error, might be 404 or still loading
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-red-600 mb-4">Appointment not found or could not be loaded.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Appointment List</button>
                </div>
            </div>
        );
    }

    if (clientFetchError) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error loading associations: {clientFetchError}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Appointment List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Edit Appointment</h1>
                <p className="text-center text-gray-600 mb-8">Modify the appointment details below.</p>

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
                                    <div className="col-span-1">
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

export default EditAppointmentPage;
