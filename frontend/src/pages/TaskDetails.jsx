import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, AlertCircle, User, Briefcase, Edit, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Status and priority configurations
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
    overdue: { label: 'Overdue', color: 'bg-rose-100 text-rose-800' }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-slate-100 text-slate-800' },
    medium: { label: 'Medium', color: 'bg-sky-100 text-sky-800' },
    high: { label: 'High', color: 'bg-amber-100 text-amber-800' },
    urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-800' }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tasks/${id}`);
        setTask(response.data);
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  // Handle task deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await api.delete(`/tasks/${id}`);
        navigate('/tasks');
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await api.patch(`/tasks/${id}`, { status: newStatus });
      setTask({ ...task, status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto mt-8">
          <div className="text-center py-12">
            <XCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Task not found</h3>
            <p className="mt-1 text-sm text-gray-500">The task you're looking for doesn't exist or has been deleted.</p>
            <div className="mt-6">
              <Link
                to="/tasks"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
                Back to Tasks
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </button>
          <div className="flex space-x-3">
            <Link
              to={`/tasks/edit/${task._id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Edit className="-ml-1 mr-2 h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Task details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                {statusConfig[task.status]?.label || task.status}
              </span>
            </div>
            <div className="mt-1 max-w-2xl text-sm text-gray-500">
              {task.description || 'No description provided.'}
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {/* Status */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusConfig[task.status]?.label || task.status}
                    </span>
                    <div className="flex space-x-2">
                      {Object.entries(statusConfig).map(([key, { label }]) => (
                        <button
                          key={key}
                          onClick={() => handleStatusUpdate(key)}
                          disabled={task.status === key}
                          className={`px-2 py-1 text-xs rounded ${task.status === key ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </dd>
              </div>

              {/* Priority */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig[task.priority]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {priorityConfig[task.priority]?.label || task.priority}
                  </span>
                </dd>
              </div>

              {/* Due Date */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {formatDate(task.dueDate)}
                    {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        Overdue
                      </span>
                    )}
                  </div>
                </dd>
              </div>

              {/* Assigned To */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    {task.assignedTo ? 
                      `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                      'Unassigned'}
                  </div>
                </dd>
              </div>

              {/* Related Case */}
              {task.case && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Related Case</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                      {task.case.caseName} ({task.case.caseNumber})
                    </div>
                  </dd>
                </div>
              )}

              {/* Created At */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-500 sm:mt-0 sm:col-span-2">
                  {formatDate(task.createdAt)} by {task.createdBy?.name || 'System'}
                </dd>
              </div>


              {/* Last Updated */}
              {task.updatedAt && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-500 sm:mt-0 sm:col-span-2">
                    {formatDate(task.updatedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Completion Notes */}
        {task.status === 'completed' && task.completedNotes && (
          <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-emerald-800">Completion Notes</h3>
                <div className="mt-2 text-sm text-emerald-700">
                  <p>{task.completedNotes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaskDetails;
