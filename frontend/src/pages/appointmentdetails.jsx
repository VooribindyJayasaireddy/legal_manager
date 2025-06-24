import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Pencil, Loader2, Clock, MapPin, Users, FileText, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
};

const appointmentTypes = [
  { value: 'meeting', label: 'In-Person Meeting' },
  { value: 'call', label: 'Phone Call' },
  { value: 'video', label: 'Video Conference' },
  { value: 'court', label: 'Court Appearance' },
  { value: 'other', label: 'Other' }
];

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rescheduled':
        return 'Rescheduled';
      default:
        return 'Unknown';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'meeting':
        return 'In-Person Meeting';
      case 'call':
        return 'Phone Call';
      case 'video':
        return 'Video Conference';
      case 'court':
        return 'Court Appearance';
      case 'other':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const formatDateTime = (d) => `${format(new Date(d), 'MMM d, yyyy')} ${format(new Date(d), 'h:mm a')}`;

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await api.get(`/appointments/${id}`);
        setAppointment(res.data);
      } catch (err) {
        console.error('Error fetching appointment', err);
        setError('Failed to load appointment.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (!appointment) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Appointment not found</h2>
          <p className="mt-1 text-sm text-gray-500">The requested appointment could not be found.</p>
          <button
            onClick={() => navigate('/appointments')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/appointments')} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back to Appointments
        </button>
        <button 
          onClick={() => navigate(`/appointments/${appointment._id}/edit`)}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
        >
          <Pencil size={16} /> Edit Appointment
        </button>
      </div>

      <div className="flex items-center mb-2">
        <h1 className="text-3xl font-bold">{appointment.title || 'Untitled Appointment'}</h1>
        <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
          {getStatusLabel(appointment.status)}
        </span>
      </div>
      
      <p className="text-gray-500 mb-6">
        {getTypeLabel(appointment.type)}
        {appointment.location && ` • ${appointment.location}`}
      </p>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Appointment Overview */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} />
              <h2 className="font-semibold text-lg">Appointment Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium">Start Time</div>
                <div className="text-gray-700">{formatDateTime(appointment.startTime)}</div>
                
                <div className="font-medium mt-4">End Time</div>
                <div className="text-gray-700">{formatDateTime(appointment.endTime)}</div>
                
                <div className="font-medium mt-4">Duration</div>
                <div className="text-gray-700">
                  {Math.round((new Date(appointment.endTime) - new Date(appointment.startTime)) / (1000 * 60))} minutes
                </div>
              </div>
              
              <div className="space-y-2">
                {appointment.location && (
                  <>
                    <div className="font-medium">Location</div>
                    <div className="text-gray-700 flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      {appointment.location}
                    </div>
                  </>
                )}
                
                <div className="font-medium mt-4">Type</div>
                <div className="text-gray-700">{getTypeLabel(appointment.type)}</div>
                
                <div className="font-medium mt-4">Status</div>
                <div className="text-gray-700">{getStatusLabel(appointment.status)}</div>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} />
              <h2 className="font-semibold text-lg">Participants</h2>
            </div>
            <div className="space-y-2">
              {appointment.participants?.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {appointment.participants.map((participant, index) => (
                    <li key={index} className="py-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {participant.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{participant}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No participants added</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} />
                <h2 className="font-semibold text-lg">Notes</h2>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line text-gray-700">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Related Information */}
          {(appointment.client || appointment.case) && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} />
                <h2 className="font-semibold text-lg">Related Information</h2>
              </div>
              <div className="space-y-2 text-sm">
                {appointment.client && (
                  <div>
                    <span className="font-medium">Client:</span>{' '}
                    <span className="text-gray-700">{appointment.client}</span>
                  </div>
                )}
                {appointment.case && (
                  <div>
                    <span className="font-medium">Case:</span>{' '}
                    <span className="text-gray-700">{appointment.case}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
