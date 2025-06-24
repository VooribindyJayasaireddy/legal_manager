import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from '../components/Layout';
import EventModal from '../components/EventModal';
import { FaBell, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

// Setup date-fns localizer
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [eventType, setEventType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      setEvents(parsedEvents);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    
    // Set up reminders
    events.forEach(event => {
      if (event.reminder && new Date(event.reminder) > new Date()) {
        const reminderTime = new Date(event.reminder).getTime() - Date.now();
        if (reminderTime > 0) {
          setTimeout(() => {
            toast.info(`Reminder: ${event.title} is starting soon!`, {
              autoClose: 10000,
              position: 'top-right',
            });
          }, reminderTime);
        }
      }
    });
  }, [events]);

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({
      start,
      end: addMinutes(start, 60), // Default 1 hour duration
      title: '',
      description: '',
      type: 'meeting',
      reminder: null
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent({
      ...event,
      reminder: event.reminder ? new Date(event.reminder) : null
    });
    setShowModal(true);
  };

  const handleSaveEvent = (eventData) => {
    if (eventData.id) {
      // Update existing event
      setEvents(events.map(event => 
        event.id === eventData.id ? { ...eventData } : event
      ));
    } else {
      // Add new event
      const newEvent = {
        ...eventData,
        id: Date.now(),
      };
      setEvents([...events, newEvent]);
    }
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    setEventToDelete(eventId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      // Find the event being deleted for the success message
      const deletedEvent = events.find(event => event.id === eventToDelete);
      
      setEvents(events.filter(event => event.id !== eventToDelete));
      setShowModal(false);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      setEventToDelete(null);
      
      // Show success message
      toast.success(`Event "${deletedEvent?.title || 'Untitled'}" has been deleted.`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const filteredEvents = eventType === 'all' 
    ? events 
    : events.filter(event => event.type === eventType);

  const eventStyleGetter = (event) => {
    let backgroundColor = '';
    switch (event.type) {
      case 'court':
        backgroundColor = '#f87171'; // red
        break;
      case 'meeting':
        backgroundColor = '#60a5fa'; // blue
        break;
      case 'task':
        backgroundColor = '#34d399'; // green
        break;
      case 'reminder':
        backgroundColor = '#fbbf24'; // yellow
        break;
      default:
        backgroundColor = '#a78bfa'; // purple
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.8rem',
      },
    };
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-gray-500 text-sm">Manage your schedule, court dates, and appointments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              className="border rounded px-3 py-2 text-sm mb-2 sm:mb-0"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="court">Court Hearings</option>
              <option value="meeting">Meetings</option>
              <option value="task">Tasks</option>
              <option value="reminder">Reminders</option>
            </select>
            <button 
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900 flex items-center gap-2 justify-center"
              onClick={() => {
                setSelectedEvent({
                  start: new Date(),
                  end: addMinutes(new Date(), 60),
                  title: '',
                  description: '',
                  type: 'meeting',
                  reminder: null
                });
                setShowModal(true);
              }}
            >
              <FaPlus /> New Event
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "70vh" }}
            views={['month', 'week', 'day', 'agenda']}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              event: ({ event }) => (
                <div className="p-1">
                  <div className="flex items-center gap-1">
                    {event.reminder && <FaBell className="text-xs" />}
                    <span className="truncate">{event.title}</span>
                  </div>
                  {view !== 'month' && event.description && (
                    <div className="text-xs truncate">{event.description}</div>
                  )}
                </div>
              ),
            }}
          />
        </div>

        {showModal && (
          <EventModal
            event={selectedEvent}
            onClose={() => {
              setShowModal(false);
              setSelectedEvent(null);
            }}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-red-200">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Event
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-800">
                        Are you sure you want to delete this event? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Layout>
  );
};

export default CalendarPage;