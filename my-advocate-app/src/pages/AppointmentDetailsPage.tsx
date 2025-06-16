import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Define types for Appointment data
interface Appointment {
    _id: string;
    user: string;
    title: string;
    description?: string;
    client?: { _id: string; firstName: string; lastName: string; email?: string; phone?: string; }; // Populated Client info
    case?: { _id: string; caseName: string; caseNumber?: string; }; // Populated Case info
    startTime: string;
    endTime: string;
    location?: string;
    attendees: { name?: string; email?: string; phone?: string; role?: string }[];
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AppointmentDetailsPageProps {
    onBackToList: () => void;
    onEditAppointment: (appointmentId: string) => void;
    onLogout: () => void;
}

const AppointmentDetailsPage: React.FC<AppointmentDetailsPageProps> = ({ onBackToList, onEditAppointment, onLogout }) => {
    const { id } = useParams<{ id: string }>(); // Get appointment ID from URL
    const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointmentDetails = useCallback(async () => {
        if (!id) {
            setError('Appointment ID not provided in URL.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            const apiUrl = `http://localhost:5000/api/appointments/${id}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: Appointment = await response.json();
                setAppointmentDetails(data);
            } else if (response.status === 404) {
                setError('Appointment not found.');
            } else if (response.status === 401 || response.status === 403) {
                setError('Session expired or unauthorized. Please log in again.');
                onLogout();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch appointment details.');
                console.error('Failed to fetch appointment details:', response.status, errorData);
            }
        } catch (err) {
            console.error('Network or unexpected error fetching appointment details:', err);
            setError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, [id, onLogout]);

    useEffect(() => {
        fetchAppointmentDetails();
    }, [fetchAppointmentDetails]);

    const formatDateTime = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading appointment details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {error}
                    <button onClick={onBackToList} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Back to Appointment List
                    </button>
                </div>
            </div>
        );
    }

    if (!appointmentDetails) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-lg text-gray-700 mb-4">Appointment data not available.</p>
                    <button onClick={onBackToList} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Back to Appointment List</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Appointment Details</h1>
                    <button
                        onClick={onBackToList}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-150"
                    >
                        Back to List
                    </button>
                </div>

                {/* Main Appointment Info */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{appointmentDetails.title}</h2>
                    <p className="text-gray-600 text-lg mb-4">{appointmentDetails.description || 'No description provided.'}</p>
                    <div className="flex items-center space-x-2 text-gray-700 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            appointmentDetails.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointmentDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointmentDetails.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800' // rescheduled
                        }`}>
                            {appointmentDetails.status.charAt(0).toUpperCase() + appointmentDetails.status.slice(1)}
                        </span>
                        {appointmentDetails.reminderSent && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                Reminder Sent
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Information Column */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Time & Location</h3>
                        <div className="space-y-3 text-gray-700">
                            <p className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                <strong>Start Time:</strong> {formatDateTime(appointmentDetails.startTime)}
                            </p>
                            <p className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                <strong>End Time:</strong> {formatDateTime(appointmentDetails.endTime)}
                            </p>
                            {appointmentDetails.location && (
                                <p className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                                    <strong>Location:</strong> {appointmentDetails.location}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Related Information Column */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Related Information</h3>
                        <div className="space-y-3">
                            {appointmentDetails.client && (
                                <div className="bg-blue-50 p-3 rounded-lg flex items-center space-x-3">
                                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                                    <div>
                                        <p className="font-semibold text-gray-800">Client: {appointmentDetails.client.firstName} {appointmentDetails.client.lastName}</p>
                                        {appointmentDetails.client.email && <p className="text-sm text-gray-600">{appointmentDetails.client.email}</p>}
                                        {appointmentDetails.client.phone && <p className="text-sm text-gray-600">{appointmentDetails.client.phone}</p>}
                                    </div>
                                </div>
                            )}
                            {appointmentDetails.case && (
                                <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-3">
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                                    <div>
                                        <p className="font-semibold text-gray-800">Case: {appointmentDetails.case.caseName}</p>
                                        {appointmentDetails.case.caseNumber && <p className="text-sm text-gray-600">Case #: {appointmentDetails.case.caseNumber}</p>}
                                    </div>
                                </div>
                            )}
                            {(!appointmentDetails.client && !appointmentDetails.case) && (
                                <p className="text-gray-600">No client or case associated.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendees Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Attendees</h3>
                    <div className="space-y-3">
                        {appointmentDetails.attendees && appointmentDetails.attendees.length > 0 ? (
                            appointmentDetails.attendees.map((attendee, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                                    <div>
                                        <p className="font-semibold text-gray-800">{attendee.name || 'N/A'}</p>
                                        {attendee.email && <p className="text-sm text-gray-600">{attendee.email}</p>}
                                        {attendee.phone && <p className="text-sm text-gray-600">{attendee.phone}</p>}
                                        {attendee.role && <p className="text-xs text-gray-500">Role: {attendee.role}</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">No additional attendees.</p>
                        )}
                    </div>
                </div>

                {/* Created/Updated Info */}
                <div className="text-right text-gray-500 text-sm mt-8">
                    <p>Last updated: {formatDateTime(appointmentDetails.updatedAt)}</p>
                    <p>Created: {formatDateTime(appointmentDetails.createdAt)}</p>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        onClick={() => onEditAppointment(appointmentDetails._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-150"
                    >
                        Edit Appointment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsPage;
