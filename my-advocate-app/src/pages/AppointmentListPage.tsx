import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Define types for Appointment data
interface Appointment {
    _id: string;
    user: string;
    title: string;
    description?: string;
    client?: string; // Client ID, will be populated on frontend
    case?: string;   // Case ID, will be populated on frontend
    startTime: string;
    endTime: string;
    location?: string;
    attendees: { name?: string; email?: string; phone?: string; role?: string }[];
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
}

// Define Client type for display info lookup
interface ClientDisplayInfo {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

// Define Case type for display info lookup
interface CaseDisplayInfo {
    _id: string;
    caseName: string;
    caseNumber?: string;
}


interface AppointmentListPageProps {
    onAddAppointmentClick: () => void;
    onViewAppointment: (appointmentId: string) => void;
    onEditAppointment: (appointmentId: string) => void;
    onDeleteAppointment: (appointmentId: string) => void;
    onLogout: () => void;
}

const AppointmentList: React.FC<AppointmentListPageProps> = ({
    onAddAppointmentClick,
    onViewAppointment,
    onEditAppointment,
    onDeleteAppointment,
    onLogout,
}) => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<string>('All Status'); // Placeholder for filter
    const [dateRange, setDateRange] = useState<string>('All Dates'); // Placeholder for date range
    const [isAppointmentsLoading, setIsAppointmentsLoading] = useState<boolean>(true);
    const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
    const [isAppointmentsMenuOpen, setIsAppointmentsMenuOpen] = useState<boolean>(true); // Sidebar submenu state
    const [sortBy, setSortBy] = useState<string>('Recent Appointments'); // Default sort
    // States for associated data needed for display
    const [allClients, setAllClients] = useState<ClientDisplayInfo[]>([]);
    const [allCases, setAllCases] = useState<CaseDisplayInfo[]>([]);

    const fetchAppointmentsAndAssociations = useCallback(async () => {
        setIsAppointmentsLoading(true);
        setAppointmentsError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setAppointmentsError('Authentication token not found. Please log in again.');
                onLogout();
                return;
            }

            // Fetch Appointments
            const appointmentsApiUrl = 'http://localhost:5000/api/appointments'; // Your backend endpoint
            const apptsResponse = await fetch(appointmentsApiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (apptsResponse.ok) {
                setAppointments(await apptsResponse.json());
            } else if (apptsResponse.status === 401 || apptsResponse.status === 403) {
                setAppointmentsError('Session expired or unauthorized. Please log in again.');
                onLogout();
                return;
            } else {
                const errorData = await apptsResponse.json();
                setAppointmentsError(errorData.message || 'Failed to fetch appointments.');
                console.error('Failed to fetch appointments:', apptsResponse.status, errorData);
            }

            // Fetch all Clients (needed to display client names on cards)
            const clientsApiUrl = 'http://localhost:5000/api/clients';
            const clientsResponse = await fetch(clientsApiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (clientsResponse.ok) {
                setAllClients(await clientsResponse.json());
            } else {
                console.warn('Failed to fetch clients for appointment display.');
            }

            // Fetch all Cases (needed to display case names on cards)
            const casesApiUrl = 'http://localhost:5000/api/cases';
            const casesResponse = await fetch(casesApiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (casesResponse.ok) {
                setAllCases(await casesResponse.json());
            } else {
                console.warn('Failed to fetch cases for appointment display.');
            }

        } catch (err) {
            console.error('Network or unexpected error fetching appointments/associations:', err);
            setAppointmentsError('Failed to connect to the server or unexpected error.');
        } finally {
            setIsAppointmentsLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchAppointmentsAndAssociations();
    }, [fetchAppointmentsAndAssociations]);

    // Helper functions for date/time formatting
    const formatDateOnly = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString;
        }
    };

    const formatTimeRange = (startTimeString: string | undefined, endTimeString: string | undefined) => {
        if (!startTimeString || !endTimeString) return 'N/A';
        try {
            const start = new Date(startTimeString);
            const end = new Date(endTimeString);
            const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
            return `${start.toLocaleTimeString(undefined, timeOptions)} - ${end.toLocaleTimeString(undefined, timeOptions)}`;
        } catch (e) {
            return `${startTimeString} - ${endTimeString}`;
        }
    };

    // Helper to get associated client/case name
    const getClientName = (clientId: string | undefined) => {
        if (!clientId) return null;
        const client = allClients.find(c => c._id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : null;
    };

    const getCaseName = (caseId: string | undefined) => {
        if (!caseId) return null;
        const caseItem = allCases.find(c => c._id === caseId);
        return caseItem ? `${caseItem.caseName} #${caseItem.caseNumber}` : null;
    };

    // Filter and sort appointments (placeholder logic for now)
    const filteredAndSortedAppointments = appointments
        .filter((appt) =>
            `${appt.title} ${appt.description || ''} ${appt.location || ''} ${getClientName(appt.client) || ''} ${getCaseName(appt.case) || ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Sort by start time, most recent first
            if (sortBy === 'Recent Uploads' || sortBy === 'Recent Appointments') {
                return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
            }
            // Add other sorting logic here if needed (e.g., by title)
            return 0;
        });


    if (isAppointmentsLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-inter">
                <div className="text-xl text-gray-700">Loading appointments...</div>
            </div>
        );
    }

    if (appointmentsError) {
        return (
            <div className="min-h-screen bg-red-100 flex items-center justify-center font-inter">
                <div className="text-xl text-red-700 p-4 rounded-lg bg-red-200 text-center">
                    Error: {appointmentsError}
                    <button onClick={onLogout} className="block mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800">
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Filter and Sort options */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-4">
                        <button className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                            Filter
                        </button>
                        <button className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                            </svg>
                            Date Range
                        </button>
                        <button className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 00-2 2v2m0 0a2 2 0 002 2h4a2 2 0 002-2V4m0 0a2 2 0 00-2-2H8a2 2 0 00-2 2v2m0 0a2 2 0 002 2h4a2 2 0 002-2V4"></path>
                            </svg>
                            All Status
                        </button>
                    </div>
                    <button
                        onClick={onAddAppointmentClick}
                        className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Create Appointment
                    </button>
                </div>

                {!isAppointmentsLoading && !appointmentsError && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAndSortedAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">
                                            No appointments found. {searchTerm ? 'Try a different search term.' : 'Schedule your first appointment to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAndSortedAppointments.map((appointment) => (
                                        <tr key={appointment._id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-900">{appointment.title}</div>
                                                {appointment.location && (
                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                        <svg className="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        {appointment.location}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-sm text-gray-900">{formatDateOnly(appointment.startTime)}</div>
                                                <div className="text-sm text-gray-500">{formatTimeRange(appointment.startTime, appointment.endTime)}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                {appointment.client ? (
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-blue-600 text-xs font-medium">
                                                                {getClientName(appointment.client)?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {getClientName(appointment.client) || 'Unknown Client'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {appointment.status && (
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onViewAppointment(appointment._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                                                        title="View Appointment"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onEditAppointment(appointment._id)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors duration-200"
                                                        title="Edit Appointment"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteAppointment(appointment._id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                                                        title="Delete Appointment"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
export default AppointmentList;
