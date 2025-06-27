import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { Briefcase, FileText, Clock, CheckCircle, Users } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../App';

// Register ChartJS components with additional configurations
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Default chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { size: 14 },
      bodyFont: { size: 14 },
      padding: 12,
      usePointStyle: true,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed !== null) {
            label += context.parsed.y || context.raw;
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        precision: 0,
        font: {
          size: 12
        }
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

const pieOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    legend: {
      ...chartOptions.plugins.legend,
      position: 'right'
    },
    tooltip: {
      ...chartOptions.plugins.tooltip,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State variables for current and previous period data
  const [currentPeriod, setCurrentPeriod] = useState({
    cases: [],
    documents: [],
    appointments: [],
    tasks: [],
    clients: []
  });
  
  const [previousPeriod, setPreviousPeriod] = useState({
    cases: [],
    documents: [],
    appointments: [],
    tasks: [],
    clients: []
  });
  
  const [analytics, setAnalytics] = useState({
    casesByStatus: { labels: [], data: [] },
    clientsByType: { labels: [], data: [] }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Calculate date ranges for current and previous periods
  const getDateRanges = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    return {
      currentStart: currentMonthStart.toISOString().split('T')[0],
      previousStart: previousMonthStart.toISOString().split('T')[0],
      previousEnd: previousMonthEnd.toISOString().split('T')[0]
    };
  };
  


  // Helper function to format time
  const formatTime = (date) => moment(date).format('h:mm A');
  
  // Calculate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Process case status data for analytics
  const processCaseStatusData = (cases) => {
    const statusCounts = {};
    const defaultStatuses = ['Open', 'In Progress', 'Pending', 'Closed', 'Rejected'];
    
    // Initialize all statuses with 0
    defaultStatuses.forEach(status => {
      statusCounts[status] = 0;
    });
    
    // Count actual statuses
    cases.forEach(caseItem => {
      // Handle different possible status field names
      const status = (caseItem.status || caseItem.caseStatus || 'Open').trim();
      if (status in statusCounts) {
        statusCounts[status]++;
      } else {
        statusCounts[status] = 1;
      }
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    return { labels, data };
  };
  
  // Process client status data for analytics
  const processClientTypeData = (clients) => {
    const statusCounts = {
      'Active': 0,
      'Inactive': 0,
      'Lead': 0,
      'Former Client': 0
    };
    
    // Count client statuses
    clients.forEach(client => {
      const status = client.status || 'Active'; // Default to 'Active' if status is not set
      if (status in statusCounts) {
        statusCounts[status]++;
      } else {
        // If we get an unexpected status, add it to the counts
        statusCounts[status] = 1;
      }
    });
    
    // Convert to arrays for the chart
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    return { 
      labels, 
      data,
      title: 'Clients by Status'  // Add title for the chart
    };
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to load dashboard data...');
      
      // Get date ranges for filtering
      const { currentStart, previousStart, previousEnd } = getDateRanges();
      
      // Log API base URL
      console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      try {
        // Test API connection
        const testResponse = await api.get('/');
        console.log('Test API response:', testResponse);
      } catch (testError) {
        console.error('Test API error:', testError);
      }
      
      // Fetch all required data in parallel
      console.log('Fetching data from API...');
      const [
        casesRes, 
        clientsRes,
        documentsRes,
        appointmentsRes,
        tasksRes
      ] = await Promise.all([
        api.get('/cases').catch((err) => {
          console.error('Error fetching cases:', err);
          return { data: [] };
        }),
        api.get('/clients').catch((err) => {
          console.error('Error fetching clients:', err);
          return { data: [] };
        }),
        api.get('/documents').catch((err) => {
          console.error('Error fetching documents:', err);
          return { data: [] };
        }),
        api.get('/appointments').catch((err) => {
          console.error('Error fetching appointments:', err);
          return { data: [] };
        }),
        api.get('/tasks').catch((err) => {
          console.error('Error fetching tasks:', err);
          return { data: [] };
        })
      ]);
      
      console.log('API Responses:', {
        cases: casesRes,
        clients: clientsRes,
        documents: documentsRes,
        appointments: appointmentsRes,
        tasks: tasksRes
      });
      
      // Process the data
      const currentCases = Array.isArray(casesRes?.data) ? casesRes.data : [];
      const currentClients = Array.isArray(clientsRes?.data) ? clientsRes.data : [];
      const currentDocuments = Array.isArray(documentsRes?.data) ? documentsRes.data : [];
      const currentAppointments = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];
      const currentTasks = Array.isArray(tasksRes?.data) ? tasksRes.data : [];
      
      console.log('Processed data:', {
        cases: currentCases,
        clients: currentClients,
        documents: currentDocuments,
        appointments: currentAppointments,
        tasks: currentTasks
      });
      
      // Process analytics data
      const casesByStatus = processCaseStatusData(currentCases);
      const clientsByType = processClientTypeData(currentClients);
      
      // Update state with fetched data
      setAnalytics({
        casesByStatus,
        clientsByType
      });
      
      // Set current period data
      setCurrentPeriod({
        cases: currentCases,
        documents: currentDocuments,
        appointments: currentAppointments,
        tasks: currentTasks,
        clients: currentClients
      });
      
      // For previous period, we'll just show empty as we're not filtering by date for now
      setPreviousPeriod({
        cases: [],
        documents: [],
        appointments: [],
        tasks: [],
        clients: []
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      // Reset to empty data
      setCurrentPeriod({ cases: [], documents: [], appointments: [], tasks: [] });
      setPreviousPeriod({ cases: [], documents: [], appointments: [], tasks: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Filter upcoming appointments from current period
  const upcomingAppointments = currentPeriod.appointments.filter(appt => 
    moment(appt.date || appt.startTime).isSameOrAfter(moment(), 'day')
  );
  
  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / Math.max(1, previous)) * 100);
  };
  
  // Get trend indicator
  const getTrend = (current, previous) => {
    if (current > previous) return 'increase';
    if (current < previous) return 'decrease';
    return 'neutral';
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header with greeting and time */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}{user?.name ? `, ${user.name}` : ''} ✌️
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
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SummaryCard 
            title="Active Cases" 
            count={currentPeriod.cases.length} 
            previousCount={previousPeriod.cases.length}
            change={calculateChange(currentPeriod.cases.length, previousPeriod.cases.length)}
            trend={getTrend(currentPeriod.cases.length, previousPeriod.cases.length)}
            icon={<Briefcase className="h-6 w-6" />}
            onClick={() => navigate('/cases')}
          />
          <SummaryCard 
            title="Appointments" 
            count={currentPeriod.appointments.length} 
            previousCount={previousPeriod.appointments.length}
            change={calculateChange(currentPeriod.appointments.length, previousPeriod.appointments.length)}
            trend={getTrend(currentPeriod.appointments.length, previousPeriod.appointments.length)}
            icon={<Clock className="h-6 w-6" />}
            onClick={() => navigate('/appointments')}
          />
          <SummaryCard 
            title="Tasks" 
            count={currentPeriod.tasks.length} 
            previousCount={previousPeriod.tasks.length}
            change={calculateChange(currentPeriod.tasks.length, previousPeriod.tasks.length)}
            trend={getTrend(currentPeriod.tasks.length, previousPeriod.tasks.length)}
            icon={<CheckCircle className="h-6 w-6" />}
            onClick={() => navigate('/tasks')}
          />
          <SummaryCard 
            title="Documents" 
            count={currentPeriod.documents.length} 
            previousCount={previousPeriod.documents.length}
            change={calculateChange(currentPeriod.documents.length, previousPeriod.documents.length)}
            trend={getTrend(currentPeriod.documents.length, previousPeriod.documents.length)}
            icon={<FileText className="h-6 w-6" />}
            onClick={() => navigate('/documents')}
          />
        </div>

        {/* Analytics Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases by Status - Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cases by Status</h3>
              <div className="h-80 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : analytics.casesByStatus.labels.length > 0 ? (
                  <Bar
                    data={{
                      labels: analytics.casesByStatus.labels,
                      datasets: [{
                        label: 'Number of Cases',
                        data: analytics.casesByStatus.data,
                        backgroundColor: [
                          'rgba(17, 38, 231, 0.7)',  // Blue-500
                          'rgba(37, 183, 202, 0.7)',  // Emerald-500
                          'rgba(245, 158, 11, 0.7)',  // Amber-500
                          'rgba(239, 68, 68, 0.7)',   // Red-500
                          'rgba(139, 92, 246, 0.7)'   // Violet-500
                        ],
                        borderColor: [
                          'rgb(32, 11, 221)',   // Blue-500
                          'rgb(16, 185, 171)',   // Emerald-500
                          'rgba(245, 158, 11, 1)',   // Amber-500
                          'rgba(239, 68, 68, 1)',    // Red-500
                          'rgba(139, 92, 246, 1)'    // Violet-500
                        ],
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false,
                      }]
                    }}
                    options={{
                      ...chartOptions,
                      indexAxis: 'x',
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          display: false
                        },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            ...chartOptions.plugins.tooltip.callbacks,
                            label: (context) => `${context.parsed.y} case${context.parsed.y !== 1 ? 's' : ''}`
                          }
                        }
                      },
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            display: true,
                            text: 'Number of Cases',
                            font: {
                              weight: 'bold'
                            }
                          }
                        },
                        x: {
                          ...chartOptions.scales.x,
                          title: {
                            display: true,
                            text: 'Case Status',
                            font: {
                              weight: 'bold'
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-2" />
                    <p>No case data available</p>
                    <button 
                      onClick={loadDashboardData}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <span>Refresh Data</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>


            {/* Clients by Status - Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clients by Status</h3>
              <div className="h-80 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : analytics.clientsByType.labels.length > 0 ? (
                  <Pie
                    data={{
                      labels: analytics.clientsByType.labels,
                      datasets: [{
                        label: 'Number of Clients',
                        data: analytics.clientsByType.data,
                        backgroundColor: [
                          'rgba(33, 208, 214, 0.7)',    // Emerald-500 - Active
                          'rgba(239, 68, 68, 0.7)',     // Red-500 - Inactive
                          'rgba(250, 204, 21, 0.7)',    // Yellow-400 - Lead
                          'rgba(107, 114, 128, 0.7)',   // Gray-500 - Former Client
                          'rgba(59, 130, 246, 0.7)'     // Blue-500 - Other statuses
                        ],
                        borderColor: [
                          'rgb(26, 190, 202)',     // Emerald-500 - Active
                          'rgba(239, 68, 68, 1)',      // Red-500 - Inactive
                          'rgba(250, 204, 21, 1)',      // Yellow-400 - Lead
                          'rgba(107, 114, 128, 1)',     // Gray-500 - Former Client
                          'rgba(59, 130, 246, 1)'       // Blue-500 - Other statuses
                        ],
                        borderWidth: 1,
                        hoverOffset: 8,
                        spacing: 2,
                      }]
                    }}
                    options={{
                      ...pieOptions,
                      plugins: {
                        ...pieOptions.plugins,
                        title: {
                          ...pieOptions.plugins.title,
                          display: true,
                          text: 'Client Status Distribution',
                          font: {
                            size: 16,
                            weight: 'bold'
                          },
                          padding: {
                            bottom: 20
                          }
                        },
                        legend: {
                          ...pieOptions.plugins.legend,
                          position: 'right',
                          labels: {
                            ...pieOptions.plugins.legend.labels,
                            padding: 15,
                            font: {
                              size: 12
                            },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20
                          }
                        },
                        tooltip: {
                          ...pieOptions.plugins.tooltip,
                          callbacks: {
                            ...pieOptions.plugins.tooltip.callbacks,
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} client${value !== 1 ? 's' : ''} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      elements: {
                        arc: {
                          borderWidth: 0,
                          borderRadius: 4
                        }
                      },
                      cutout: '50%',
                      radius: '90%'
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                    <Users className="h-12 w-12 text-gray-300 mb-2" />
                    <p>No client data available</p>
                    <button 
                      onClick={loadDashboardData}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <span>Refresh Data</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Upcoming Tasks & Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Upcoming Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
                  <button 
                    onClick={() => navigate('/tasks')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {currentPeriod.tasks.length > 0 ? (
                  currentPeriod.tasks
                    .filter(task => !task.completed && new Date(task.dueDate) >= new Date())
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 5)
                    .map((task, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/tasks/${task._id}`)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Due {moment(task.dueDate).format('MMM D, YYYY')}
                              {task.priority === 'high' && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                                  High Priority
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <div className={`h-2.5 w-2.5 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No upcoming tasks</p>
                    <button 
                      onClick={() => navigate('/tasks/new')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Create a task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
                  <button 
                    onClick={() => navigate('/appointments')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {currentPeriod.appointments.length > 0 ? (
                  currentPeriod.appointments
                    .filter(apt => new Date(apt.startDate) >= new Date())
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                    .slice(0, 5)
                    .map((appointment, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/appointments/${appointment._id}`)}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 bg-blue-50 rounded-lg p-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{appointment.title}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {moment(appointment.startDate).format('MMM D, YYYY')} • {moment(appointment.startDate).format('h:mm A')} - {moment(appointment.endDate).format('h:mm A')}
                            </p>
                            {appointment.client && (
                              <p className="text-sm text-gray-500 mt-1">
                                With: {typeof appointment.client === 'object' ? appointment.client.name : appointment.client}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No upcoming appointments</p>
                    <button 
                      onClick={() => navigate('/appointments/new')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Schedule an appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};



// SummaryCard Component
const SummaryCard = ({
  title,
  count = 0,
  icon,
  onClick,
  change = 0,
  trend = 'neutral',
  previousCount = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [rippleX, setRippleX] = useState(0);
  const [rippleY, setRippleY] = useState(0);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleClick = (e) => {
    // Ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    setRippleX(e.clientX - rect.left);
    setRippleY(e.clientY - rect.top);
    setRipple(true);
    
    // Call the original onClick after a small delay
    setTimeout(() => {
      if (onClick) onClick();
    }, 200);
  };

  // Determine trend icon and color
  let trendIcon;
  let trendColor;
  let progressBgColor;
  
  switch (trend) {
    case 'increase':
      trendIcon = (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
      trendColor = 'text-green-600';
      progressBgColor = 'bg-green-500';
      break;
    case 'decrease':
      trendIcon = (
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
      trendColor = 'text-red-600';
      progressBgColor = 'bg-red-500';
      break;
    default:
      trendIcon = (
        <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
      trendColor = 'text-gray-800';
      progressBgColor = 'bg-gray-800';
  }

  // Calculate progress bar width (capped at 100%)
  const progressWidth = Math.min(Math.abs(change), 100);

  return (
    <div 
      className={`relative p-6 rounded-xl shadow-sm transition-all duration-300 cursor-pointer overflow-hidden group ${
        isHovered ? 'shadow-lg -translate-y-1' : 'hover:shadow-md'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Ripple effect */}
      {ripple && (
        <div 
          className="absolute rounded-full bg-black bg-opacity-10 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '400px',
            height: '400px',
            left: rippleX,
            top: rippleY,
            opacity: 0,
            animation: 'ripple 0.6s linear',
          }}
          onAnimationEnd={() => setRipple(false)}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {count.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${trendColor.replace('text-', 'bg-')} bg-opacity-10`}>
          {React.cloneElement(icon, {
            className: `w-6 h-6 ${trendColor}`,
            style: { 
              transition: 'all 0.3s ease',
              transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)'
            }
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={`font-medium ${trendColor} flex items-center`}>
            {trendIcon}
            <span className="ml-1">{Math.abs(change)}%</span>
          </span>
          <span className="text-gray-500">vs last period</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-full rounded-full ${progressBgColor}`}
            style={{ 
              width: `${progressWidth}%`,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;