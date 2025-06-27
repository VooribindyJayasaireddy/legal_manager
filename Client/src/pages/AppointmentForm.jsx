import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Loader2, ArrowLeft } from 'lucide-react';

const AppointmentForm = () => {
  const { id } = useParams(); // if exists => edit mode
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'meeting',
    status: 'scheduled',
    location: '',
    notes: '',
    participants: [],
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [manualParticipant, setManualParticipant] = useState('');
  const [manualParticipants, setManualParticipants] = useState([]);
  // Removed unused showDeleteConfirm state

  // Fetch options and existing appointment if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users separately to handle potential errors
        try {
          const usersRes = await api.get('/users');
          setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
        } catch (err) {
          console.error('Error loading users:', err);
          setUsersError('Failed to load users');
          setUsers([]);
        } finally {
          setLoadingUsers(false);
        }

        if (id) {
          try {
            const apptRes = await api.get(`/appointments/${id}`);
            const apptData = {
              ...apptRes.data,
              startTime: apptRes.data.startTime?.slice(0, 16),
              endTime: apptRes.data.endTime?.slice(0, 16),
              participants: Array.isArray(apptRes.data.participants) ? apptRes.data.participants : []
            };
            setForm(apptData);
            
            // Extract manual participants from existing data
            const manualParts = apptData.participants
              .filter(id => typeof id === 'string' && id.startsWith('manual_'))
              .map(id => ({
                id,
                name: id.replace(/^manual_\d+_/, '')
              }));
            setManualParticipants(manualParts);
          } catch (err) {
            console.error('Error loading appointment:', err);
            setError('Failed to load appointment data.');
          }
        }
      } catch (err) {
        console.error('Error in loadData:', err);
        setError('An error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Handle date change for datetime-local inputs
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // Store the raw string value for the input
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If end time is being set and it's before start time, adjust start time
    if (name === 'endTime' && value && new Date(value) < new Date(form.startTime || 0)) {
      // Set start time to 1 hour before end time
      const date = new Date(value);
      date.setHours(date.getHours() - 1);
      setForm(prev => ({
        ...prev,
        startTime: formatForDateTimeLocal(date)
      }));
    }
  };

  const formatForDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Handle invalid date
    if (isNaN(date.getTime())) return '';
    // Convert to local time and format as YYYY-MM-DDTHH:MM
    const pad = num => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Prepare the payload with proper date formatting
      const payload = {
        title: form.title,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        type: form.type,
        status: form.status,
        location: form.location,
        notes: form.notes,
        participants: [...form.participants],
      };

      console.log('Submitting payload:', payload); // Debug log

      if (id) {
        // For update
        const response = await api.put(`/appointments/${id}`, payload);
        console.log('Update response:', response); // Debug log
      } else {
        // For create
        const response = await api.post('/appointments', payload);
        console.log('Create response:', response); // Debug log
      }

      // Redirect to appointments list on success
      navigate('/appointments');
    } catch (err) {
      console.error('Failed to submit form:', err);
      const errorMessage = err.response?.data?.message || 'Error saving appointment';
      setError(errorMessage);
      
      // Show more detailed error in console for debugging
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error status:', err.response.status);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteParticipant = (participantId) => {
    setForm(f => ({
      ...f,
      participants: f.participants.filter(id => id !== participantId)
    }));
    setManualParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /> Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back to Appointments
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Appointment' : 'Create New Appointment'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">Appointment Details</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={form.startTime || ''}
                  onChange={handleDateChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={form.endTime || ''}
                  min={form.startTime || new Date().toISOString().slice(0, 16)}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select 
                  name="type" 
                  value={form.type} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meeting">In-Person Meeting</option>
                  <option value="call">Phone Call</option>
                  <option value="video">Video Conference</option>
                  <option value="court">Court Appearance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={manualParticipant}
                      onChange={(e) => setManualParticipant(e.target.value)}
                      placeholder="Enter participant name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualParticipant.trim()) {
                          const newParticipant = `manual_${Date.now()}`;
                          setManualParticipants([...manualParticipants, { id: newParticipant, name: manualParticipant }]);
                          setForm(f => ({
                            ...f,
                            participants: [...f.participants, newParticipant]
                          }));
                          setManualParticipant('');
                        }
                      }}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  <select
                    multiple
                    name="participants"
                    value={form.participants}
                    onChange={(e) =>
                      setForm(f => ({
                        ...f,
                        participants: Array.from(e.target.selectedOptions, opt => opt.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  >
                    {loadingUsers ? (
                      <option disabled>Loading users...</option>
                    ) : usersError ? (
                      <option disabled>{usersError}</option>
                    ) : users.length === 0 ? (
                      <option disabled>No users available</option>
                    ) : (
                      users.map(u => (
                        <option key={u._id} value={u._id} className="px-2 py-1 hover:bg-gray-100">
                          {u.name || `User ${u._id}`}
                        </option>
                      ))
                    )}
                    {manualParticipants.map(p => (
                      <option key={p.id} value={p.id} className="px-2 py-1 text-gray-600">
                        {p.name} (external)
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {form.participants?.map(participantId => {
                      const isManual = manualParticipants.some(p => p.id === participantId);
                      const participant = isManual 
                        ? manualParticipants.find(p => p.id === participantId)
                        : users.find(u => u._id === participantId);
                      
                      if (!participant) return null;
                      
                      return (
                        <div key={participantId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">
                            {isManual ? participant.name : (participant.name || `User ${participant._id}`)}
                            {isManual && ' (external)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(participantId)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove participant"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(form.participants?.length || 0)} participant{(form.participants?.length || 0) !== 1 ? 's' : ''} selected
                    {manualParticipants.some(p => form.participants?.includes(p.id)) && 
                      ' (including manually added participants)'}
                  </p>
                </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {id ? 'Updating...' : 'Creating...'}
              </span>
            ) : id ? 'Update Appointment' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
