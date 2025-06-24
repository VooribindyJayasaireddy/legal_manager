import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2, Plus, Pencil, Eye, Search, ChevronDown, Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';

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

const AppointmentsList = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error('Failed to fetch appointments', err);
        setError('Could not load appointments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getTypeLabel = (type) =>
    appointmentTypes.find(t => t.value === type)?.label || type;

  const getStatusLabel = (status) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'h:mm a');
    } catch {
      return 'Invalid Time';
    }
  };

  const filtered = appointments.filter(app => {
    const matchesSearch = !searchQuery || (
      app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    
    try {
      setIsDeleting(true);
      setDeleteError('');
      
      await api.delete(`/appointments/${appointmentToDelete._id}`);
      
      setAppointments(prevAppointments => 
        prevAppointments.filter(app => app._id !== appointmentToDelete._id)
      );
      
      setAppointmentToDelete(null);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      setDeleteError('Failed to delete appointment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <button
            onClick={() => navigate('/appointments/new')}
            className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-md"
          >
            <option value="all">All Statuses</option>
            {Object.keys(statusColors).map(status => (
              <option key={status} value={status}>{getStatusLabel(status)}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-md"
          >
            <option value="all">All Types</option>
            {appointmentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-700">Loading appointments...</span>
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No appointments found.</div>
        ) : (
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filtered.map(app => (
                <li key={app._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div className="w-full">
                      <button 
                        onClick={() => navigate(`/appointments/${app._id}`)}
                        className="text-left w-full"
                      >
                        <h2 className="text-lg font-medium text-gray-900 hover:text-blue-600">{app.title}</h2>
                      </button>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                        <span><Clock className="inline h-4 w-4 mr-1" />{formatTime(app.startTime)} - {formatTime(app.endTime)}</span>
                        <span><Calendar className="inline h-4 w-4 mr-1" />{formatDate(app.startTime)}</span>
                        {app.location && (
                          <span><MapPin className="inline h-4 w-4 mr-1" />{app.location}</span>
                        )}
                        {app.type && <span>{getTypeLabel(app.type)}</span>}
                        {app.status && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[app.status]}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        )}
                      </div>
                      {app.client || app.case ? (
                        <div className="text-sm text-gray-400 mt-1">
                          {app.client ? `Client ID: ${app.client}` : ''} {app.case ? `| Case ID: ${app.case}` : ''}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(app);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete appointment"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {appointmentToDelete && (
          <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setAppointmentToDelete(null)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-red-200">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Appointment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-800">
                        Are you sure you want to delete the appointment "{appointmentToDelete.title}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Deleting...
                      </>
                    ) : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setAppointmentToDelete(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AppointmentsList;
