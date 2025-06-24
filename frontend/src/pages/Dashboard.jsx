// src/pages/Dashboard.jsx

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../utils/api';
import { Briefcase, Eye, Pencil } from 'lucide-react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';

const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const { user, isAuthenticated } = authContext;
  
  // Check if auth context is properly set up
  if (!authContext || !('login' in authContext)) {
    console.error('AuthContext is not properly set up!');
  }
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up interval to update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // API functions
  const getActiveCases = async () => {
    try {
      // Add status=active query parameter to filter active cases
      const response = await api.get('/cases?status=active');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching active cases:', error);
      setError('Failed to load active cases. Please try again.');
      return [];
    }
  };

  const getDocuments = async () => {
    try {
      const response = await api.get('/documents/recent');
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  };

  const getUpcomingAppointments = async () => {
    try {
      const response = await api.get('/appointments/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  };

  const getTasks = async () => {
    try {
      const response = await api.get('/tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [casesData, documentsData, appointmentsData, tasksData] = await Promise.all([
        getActiveCases(),
        getDocuments(),
        getUpcomingAppointments(),
        getTasks()
      ]);
      
      setCases(casesData);
      setDocuments(documentsData);
      setAppointments(appointmentsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh the page to try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter today's appointments
  const today = moment().format('YYYY-MM-DD');
  const todaysAppointments = appointments.filter(app => 
    moment(app.date).format('YYYY-MM-DD') === today
  );

  // Active cases are already filtered from the API
  const activeCases = cases; // Since we're only fetching active cases from the API
  const pendingDocuments = documents.filter(d => d.status === 'Pending');
  const upcomingMeetings = appointments.length;
  const clientUpdates = 3; // Placeholder until we have API
  
  // Filter priority tasks (due within 3 days or high priority)
  const priorityTasks = tasks.filter(task => {
    const dueDate = moment(task.dueDate);
    const today = moment().startOf('day');
    const daysUntilDue = dueDate.diff(today, 'days');
    return daysUntilDue <= 3 || task.priority === 'high';
  });

  // Get the current time for greeting
  const currentHour = new Date().getHours();
  let greeting = 'Welcome';
  
  if (currentHour < 12) {
    greeting = 'Good morning';
  } else if (currentHour < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  // Get the user's name - handle different possible structures
  const getDisplayName = (user) => {
    if (!user) return '';
    
    // Try different possible name properties
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    }
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    }
    if (user.fullName) return user.fullName;
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    
    return '';
  };
  
  // Get the display name
  const displayName = getDisplayName(user);
  const navigate = useNavigate();
  

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Welcome Message */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}{displayName ? `, ${displayName}` : ''} ✌️
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your cases today.
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium text-gray-900">
              {moment(currentTime).format('dddd, MMMM D, YYYY')}
            </div>
            <div className="text-sm text-gray-500">
              {moment(currentTime).format('h:mm:ss A')}
            </div>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard 
            title="Active Cases" 
            count={activeCases.length} 
            icon={<Briefcase className="h-6 w-6 text-blue-600" />} 
          />
          <SummaryCard 
            title="Pending Documents" 
            count={pendingDocuments.length} 
            icon="📄" 
          />
          <SummaryCard 
            title="Upcoming Meetings" 
            count={upcomingMeetings} 
            icon="📅" 
          />
          <SummaryCard 
            title="Client Updates" 
            count={clientUpdates} 
            icon="🧑‍⚖️" 
          />
        </div>

          {/* Active Cases */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Active Cases</h2>
              <button 
                onClick={() => window.location.href = '/cases'}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View All Cases <span className="ml-1">→</span>
              </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Details</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Hearing</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-red-600">
                          {error}
                        </td>
                      </tr>
                    ) : cases.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No active cases found
                        </td>
                      </tr>
                    ) : (
                      cases.slice(0, 5).map((c) => (
                      <tr 
                        key={c._id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/cases/${c._id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 font-medium">
                              {c.caseName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {c.caseName || 'Unnamed Case'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {c.caseNumber || 'No case number'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {c.clients && c.clients.length > 0 
                              ? c.clients[0].name 
                              : 'No client'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {c.clients && c.clients[0]?.phone || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {c.court || 'No court specified'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {c.judge || 'No judge specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {c.nextHearingDate 
                              ? moment(c.nextHearingDate).format('MMM D, YYYY') 
                              : 'Not scheduled'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {c.nextHearingDate ? moment(c.nextHearingDate).format('h:mm A') : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.status === 'open' ? 'bg-green-100 text-green-800' :
                            c.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            c.status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
                            c.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            c.status === 'archived' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {c.status ? c.status.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/cases/${c._id}`;
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="View case"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/cases/${c._id}/edit`;
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit case"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Documents */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
            <div className="bg-white shadow rounded p-4 grid grid-cols-4 gap-4">
              {documents.slice(0, 4).map(doc => (
                <div key={doc._id} className="p-4 border rounded shadow">
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-gray-500">{doc.fileType} - {doc.updatedAt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            <div className="bg-white shadow rounded p-4">
              {todaysAppointments.length === 0 ? (
                <p className="text-gray-500">No appointments scheduled for today.</p>
              ) : (
                todaysAppointments.map(app => (
                  <div key={app._id} className="border-b py-2 last:border-b-0">
                    <p className="font-medium">{app.clientName}</p>
                    <p className="text-sm text-gray-500">
                      {moment(app.date).format('hh:mm A')} - {app.purpose}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Priority Tasks */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Priority Tasks</h2>
            <div className="bg-white shadow rounded p-4">
              {priorityTasks.length === 0 ? (
                <p className="text-gray-500">No urgent tasks.</p>
              ) : (
                priorityTasks.map(task => (
                  <div key={task._id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className={task.status === 'Completed' ? 'line-through text-gray-400' : ''}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {moment(task.dueDate).format('MMM D')}
                      </p>
                    </div>
                    <span 
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : task.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {task.status || task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Assistant */}
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
            <div className="bg-white shadow rounded p-4">
              <div className="mb-4">
                <p className="text-gray-600">How can I help you today?</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded transition-colors">
                    Case research
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded transition-colors">
                    Document review
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded transition-colors">
                    Schedule meeting
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded transition-colors">
                    Generate template
                  </button>
                </div>
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-grow border border-r-0 rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ask me anything..."
                />
                <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-r transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
};

const SummaryCard = ({ title, count, icon }) => (
  <div className="bg-white shadow rounded-lg p-6 flex items-center hover:shadow-md transition-shadow duration-200">
    <div className="p-2 mr-4 rounded-full bg-blue-50 text-blue-600">
      {typeof icon === 'string' ? (
        <span className="text-2xl">{icon}</span>
      ) : (
        React.cloneElement(icon, { className: 'h-6 w-6' })
      )}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-sm text-gray-500 font-medium">{title}</div>
    </div>
  </div>
);

export default Dashboard;
