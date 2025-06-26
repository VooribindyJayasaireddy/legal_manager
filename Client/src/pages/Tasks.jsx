import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Calendar, AlertCircle, CheckCircle, Clock, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from "../utils/api";
import Layout from "../components/Layout";

const TasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState({ type: '', message: '', show: false });
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status colors - Using professional legal/brand colors
  const statusColor = {
    pending: "bg-amber-50 text-amber-800 border border-amber-200",
    in_progress: "bg-blue-50 text-blue-800 border border-blue-200",
    completed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    on_hold: "bg-purple-50 text-purple-800 border border-purple-200",
    cancelled: "bg-gray-100 text-gray-800 border border-gray-300",
    overdue: "bg-rose-50 text-rose-800 border border-rose-200"
  };

  // Priority colors - Using professional legal/brand colors
  const priorityColor = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-sky-100 text-sky-800",
    high: "bg-amber-100 text-amber-800",
    urgent: "bg-rose-100 text-rose-800"
  };

  // Show notification
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, show: true });
    const timer = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // In a real app, you would make an API call here
      // await api.delete(`/tasks/${taskToDelete._id}`);
      
      // For demo purposes, we'll just remove it from the local state
      setTasks(tasks.filter(task => task._id !== taskToDelete._id));
      
      showNotification('success', 'Task deleted successfully');
      setTaskToDelete(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      showNotification('error', 'Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Mock data for when API is not available
  const mockTasks = [
    {
      _id: '1',
      title: 'Review Client Contract',
      description: 'Review and finalize the client contract for the new case',
      status: 'pending',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      priority: 'high',
      assignedTo: { firstName: 'John', lastName: 'Doe', username: 'johndoe' },
      case: { caseName: 'Smith vs. Corporation', caseNumber: 'CIV-2023-001' },
      client: { firstName: 'Michael', lastName: 'Smith' },
      user: 'user123'
    },
    {
      _id: '2',
      title: 'File Court Documents',
      description: 'File the preliminary motions with the court',
      status: 'in_progress',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      priority: 'urgent',
      assignedTo: { firstName: 'Jane', lastName: 'Smith', username: 'janesmith' },
      case: { caseName: 'Johnson Estate', caseNumber: 'PROB-2023-045' },
      client: { firstName: 'Sarah', lastName: 'Johnson' },
      user: 'user123'
    },
    {
      _id: '3',
      title: 'Client Meeting',
      description: 'Initial consultation with new client',
      status: 'completed',
      dueDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      priority: 'medium',
      assignedTo: { firstName: 'Robert', lastName: 'Johnson', username: 'rjohnson' },
      case: { caseName: 'Doe Divorce', caseNumber: 'FAM-2023-112' },
      client: { firstName: 'John', lastName: 'Doe' },
      user: 'user123'
    }
  ];

  // Mock stats will be calculated from mockTasks, so we don't need this constant anymore

  // Fetch tasks from API with fallback to mock data
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tasks from API with fallback to mock data
      const tasksResponse = await api.get('/tasks').catch((err) => {
        console.error('Error fetching tasks:', err);
        return { data: mockTasks };
      });
      
      // Use API data if available, otherwise use mock data
      const tasksData = Array.isArray(tasksResponse?.data) ? tasksResponse.data : mockTasks;
      
      // Transform task data to match expected format
      const formattedTasks = tasksData.map(task => ({
        ...task,
        // Ensure all required fields exist
        assignedTo: task.assignedTo || { firstName: 'Unassigned', lastName: '' },
        case: task.case || { caseName: 'No Case', caseNumber: '' },
        client: task.client || { firstName: 'No', lastName: 'Client' }
      }));
      
      setTasks(formattedTasks);
      
      // If we're using mock data, show a warning
      if (!tasksResponse?.data) {
        const warningMsg = 'Using demo data. Backend server not available.';
        console.warn(warningMsg);
        setError(warningMsg);
        showNotification('warning', warningMsg);
      }
      
    } catch (err) {
      console.error('Error in fetchTasks:', err);
      // Fallback to mock data on error
      setTasks(mockTasks);
      const errorMessage = 'Using demo data. ' + 
                         (err.response?.data?.message || 
                          err.message || 
                          'Backend connection failed.');
      setError(errorMessage);
      showNotification('warning', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mockTasks, showNotification]);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks based on search and status filter
  const filteredTasks = tasks.filter(task => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      `${task.assignedTo?.firstName || ''} ${task.assignedTo?.lastName || ''}`.toLowerCase().includes(searchLower) ||
      task.case?.caseName?.toLowerCase().includes(searchLower) ||
      task.case?.caseNumber?.toLowerCase().includes(searchLower);
    
    const isOverdue = new Date(task.dueDate) < new Date() && 
                     task.status !== 'completed' && 
                     task.status !== 'cancelled';
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'overdue' 
                           ? isOverdue
                           : task.status === filterStatus);
    
    return matchesSearch && matchesStatus;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if task is overdue
  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && 
           status !== 'completed' && 
           status !== 'cancelled';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading tasks...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Tasks</h1>
            <p className="text-black">Manage and track your legal tasks</p>
          </div>
          <button
            onClick={() => navigate('/tasks/new')}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            
            New Task
          </button>
        </div>

        
        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-4 mb-6 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md transition duration-150 ease-in-out"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-100">
          {error ? (
            <div className="bg-rose-50 border-l-4 border-rose-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-black">{error}</p>
                </div>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-medium text-slate-800">No tasks found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter to find what you are looking for.'
                  : 'Get started by creating a new task.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/tasks/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  New Task
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <li 
                  key={task._id} 
                  className="hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        <p className="text-sm font-medium text-black">
                          {task.title}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center space-x-3">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${
                          isOverdue(task.dueDate, task.status) 
                            ? 'bg-red-100 text-red-800' 
                            : statusColor[task.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {isOverdue(task.dueDate, task.status) ? 'Overdue' : task.status.replace('_', ' ')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskToDelete(task);
                          }}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50"
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <p>
                          Due on <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.priority && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priorityColor[task.priority] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          👤 {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </span>
                      )}
                      {task.case && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🏛️ {task.case.caseName || `Case #${task.case.caseNumber}`}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {taskToDelete && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !isDeleting && setTaskToDelete(null)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Task
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the task "{taskToDelete.title}"? This action cannot be undone.
                      </p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteTask}
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
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setTaskToDelete(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div 
            className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg border ${
              notification.type === 'error' 
                ? 'bg-rose-50 border-rose-200' 
                : notification.type === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                ) : notification.type === 'warning' ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div className="ml-3">
                <p 
                  className={`text-sm font-medium ${
                    notification.type === 'error' 
                      ? 'text-rose-800' 
                      : notification.type === 'warning'
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TasksPage;