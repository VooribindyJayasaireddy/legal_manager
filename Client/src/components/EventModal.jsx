import React, { useState, useEffect } from 'react';
import { format, addMinutes, isBefore, parseISO } from 'date-fns';
import { FaBell, FaSave, FaTrash } from 'react-icons/fa';
import { X } from 'lucide-react';

const EventModal = ({ event, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    start: new Date(),
    end: addMinutes(new Date(), 60),
    type: 'meeting',
    reminder: null,
  });
  const [showReminder, setShowReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(30);
  const [reminderUnit, setReminderUnit] = useState('minutes');

  useEffect(() => {
    if (event) {
      setFormData({
        id: event.id || null,
        title: event.title || '',
        description: event.description || '',
        start: event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end),
        type: event.type || 'meeting',
        reminder: event.reminder ? new Date(event.reminder) : null,
      });
      
      if (event.reminder) {
        const reminderDate = event.reminder instanceof Date ? event.reminder : new Date(event.reminder);
        const diff = event.start - reminderDate;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 60) {
          setReminderTime(minutes);
          setReminderUnit('minutes');
        } else if (minutes < 1440) {
          setReminderTime(Math.floor(minutes / 60));
          setReminderUnit('hours');
        } else {
          setReminderTime(Math.floor(minutes / 1440));
          setReminderUnit('days');
        }
        setShowReminder(true);
      }
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const toggleReminder = () => {
    if (showReminder) {
      setFormData(prev => ({
        ...prev,
        reminder: null
      }));
    }
    setShowReminder(!showReminder);
  };

  const updateReminder = useCallback(() => {
    let reminderDate = new Date(formData.start);
    let minutes = 0;

    switch (reminderUnit) {
      case 'minutes':
        minutes = reminderTime;
        break;
      case 'hours':
        minutes = reminderTime * 60;
        break;
      case 'days':
        minutes = reminderTime * 60 * 24;
        break;
      default:
        minutes = 30; // Default 30 minutes
    }

    reminderDate.setMinutes(reminderDate.getMinutes() - minutes);
    
    setFormData(prev => ({
      ...prev,
      reminder: reminderDate
    }));
  }, [formData.start, reminderTime, reminderUnit]);

  useEffect(() => {
    if (showReminder) {
      updateReminder();
    }
  }, [reminderTime, reminderUnit, formData.start, showReminder, updateReminder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please enter a title for the event');
      return;
    }
    
    if (isBefore(formData.end, formData.start)) {
      alert('End time cannot be before start time');
      return;
    }
    
    onSave(formData);
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {formData.id ? 'Edit Event' : 'New Event'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="start"
                  name="start"
                  value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => handleDateChange('start', new Date(e.target.value))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  id="end"
                  name="end"
                  value={format(formData.end, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => handleDateChange('end', new Date(e.target.value))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                Event Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="meeting">Meeting</option>
                <option value="court">Court Hearing</option>
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="setReminder"
                  checked={showReminder}
                  onChange={toggleReminder}
                  className="mr-2"
                />
                <label htmlFor="setReminder" className="flex items-center text-gray-700 text-sm font-bold">
                  <FaBell className="mr-1" /> Set Reminder
                </label>
              </div>
              
              {showReminder && (
                <div className="flex items-center space-x-2 pl-6">
                  <span className="text-sm text-gray-600">Remind me</span>
                  <input
                    type="number"
                    min="1"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(parseInt(e.target.value) || 0)}
                    className="w-16 p-1 border rounded text-center"
                  />
                  <select
                    value={reminderUnit}
                    onChange={(e) => setReminderUnit(e.target.value)}
                    className="p-1 border rounded"
                  >
                    <option value="minutes">minutes before</option>
                    <option value="hours">hours before</option>
                    <option value="days">days before</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <div>
                {formData.id && (
                  <button
                    type="button"
                    onClick={() => onDelete(formData.id)}
                    className="flex items-center px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                  >
                    <FaTrash className="h-4 w-4 mr-1.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center px-3 py-1.5 text-sm text-white bg-black hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <FaSave className="h-4 w-4 mr-1.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
