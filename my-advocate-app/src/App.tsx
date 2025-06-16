import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Import AppLayout
import AppLayout from './components/AppLayout';
import NotificationComponent from './components/Notification';

// Import pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientList from './pages/ClientList';
import AddClientPage from './pages/AddClientPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import EditClientPage from './pages/EditClientPage';
import CaseList from './pages/CaseList';
import AddCasePage from './pages/AddCasePage';
import CaseDetailsPage from './pages/CaseDetailsPage';
import EditCasePage from './pages/EditCasePage';
import DocumentList from './pages/DocumentList';
import AddDocumentPage from './pages/AddDocumentPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import EditDocumentPage from './pages/EditDocumentPage';
import DraftList from './pages/DraftListPage';
import AddDraftPage from './pages/AddDraftPage';
import DraftDetailsPage from './pages/DraftDetailsPage';
import EditDraftPage from './pages/EditDraftPage';
import AddAppointmentPage from './pages/AddAppointmentPage';
import AppointmentDetailsPage from './pages/AppointmentDetailsPage';
import EditAppointmentPage from './pages/EditAppointmentPage';
import AppointmentListPage from './pages/AppointmentListPage';
import TaskListPage from './pages/TaskListPage';
import AddTaskPage from './pages/AddTaskPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import EditTaskPage from './pages/EditTaskPage';
import DashboardPage from './pages/DashboardPage';
import NotificationList from './pages/NotificationList';
import UserProfilePage from './pages/UserProfilePage';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationTestPage from './pages/NotificationTestPage';
import AIChatPage from './pages/AIChatPage'; // Add AI Chat page import

// Define the User type for TypeScript
interface User {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    token: string;
}

interface AppLayoutProps {
    onLogout: () => void;
    userFirstName?: string;
    userUsername?: string;
    children: React.ReactNode;  // Add this line
}

// ProtectedRoute component to handle authentication
const ProtectedRoute: React.FC<{ user: User | null; children: React.ReactElement }> = ({ user, children }) => {
    const location = useLocation();
    
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
};

// AppContent component will be wrapped by BrowserRouter
const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Function to handle successful authentication
    const handleAuthSuccess = useCallback((successData: User) => {
        localStorage.setItem('authToken', successData.token);
        localStorage.setItem('userData', JSON.stringify({
            _id: successData._id,
            username: successData.username,
            email: successData.email,
            firstName: successData.firstName,
            lastName: successData.lastName
        }));
        setUser(successData);
        navigate('/dashboard');
    }, [navigate]);

    // Function to handle user logout
    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const handleProfileUpdate = useCallback((updatedUser: User) => {
        setUser(updatedUser);
    }, []);

    // Check if user is logged in on initial application load
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('authToken');
            const userDataString = localStorage.getItem('userData');

            if (token && userDataString) {
                try {
                    const parsedUserData = JSON.parse(userDataString);
                    setUser({ ...parsedUserData, token });
                } catch (error) {
                    console.error('Error parsing user data from localStorage:', error);
                    handleLogout();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [handleLogout]);

    // Show a loading screen while authentication status is being checked
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700 font-inter">
                Loading application...
            </div>
        );
    }

    // Handle delete operations
    const handleDelete = async (endpoint: string, id: string, successMessage: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Authentication token not found. Please log in again.');
                handleLogout();
                return false;
            }
            
            const response = await fetch(`http://localhost:5000/api/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete ${endpoint}`);
            }
            
            alert(successMessage);
            return true;
        } catch (error) {
            console.error(`Error deleting ${endpoint}:`, error);
            alert(`Failed to delete ${endpoint}: ${(error as Error).message}`);
            return false;
        }
    };

    // Render routes based on authentication status
    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    !user ? (
                        <LoginPage onAuthSuccess={handleAuthSuccess} />
                    ) : (
                        <Navigate to="/dashboard" replace />
                    )
                }
            />
            <Route
                path="/register"
                element={
                    !user ? (
                        <RegisterPage onAuthSuccess={handleAuthSuccess} />
                    ) : (
                        <Navigate to="/dashboard" replace />
                    )
                }
            />

            {/* Protected Routes */}
            <Route element={
                <ProtectedRoute user={user}>
                    <AppLayout 
                        onLogout={handleLogout} 
                        userFirstName={user?.firstName} 
                        userUsername={user?.username} 
                    />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={
                    <DashboardPage
                        onLogout={handleLogout}
                        userFirstName={user?.firstName}
                        userUsername={user?.username}
                    />
                } />
                <Route path="profile" element={
                    !user ? <div>Loading...</div> : (
                        <UserProfilePage
                            onLogout={handleLogout}
                            userId={user._id}
                            onProfileUpdated={handleProfileUpdate}
                        />
                    )
                } />
                {/* Client Management Routes */}
                <Route 
                    path="/clients"
                    element={
                        <div className="flex-1 overflow-auto">
                            <ClientList
                                onAddClientClick={() => navigate('/clients/add')}
                                onViewClient={(clientId: string) => navigate(`/clients/${clientId}`)}
                                onEditClient={(clientId: string) => navigate(`/clients/${clientId}/edit`)}
                                onDeleteClient={async (clientId: string) => {
                                    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
                                        const success = await handleDelete('clients', clientId, 'Client deleted successfully!');
                                        if (success) window.location.reload();
                                    }
                                }}
                                onLogout={handleLogout}
                            />
                        </div>
                    }
                />
                <Route
                    path="/clients/add"
                    element={
                        <div className="flex-1 overflow-auto">
                            <AddClientPage
                                onBackToList={() => navigate('/clients')}
                                onSuccess={(message) => {
                                    alert(message);
                                    navigate('/clients');
                                }}
                                onLogout={handleLogout}
                            />
                        </div>
                    }
                />
                <Route
                    path="/clients/:id"
                    element={
                        <div className="flex-1 overflow-auto">
                            <ClientDetailsPage
                                onBackToList={() => navigate('/clients')}
                                onEditClient={(clientId: string) => navigate(`/clients/${clientId}/edit`)}
                                onLogout={handleLogout}
                            />
                        </div>
                    }
                />
                <Route
                    path="/clients/:id/edit"
                    element={
                        <div className="flex-1 overflow-auto">
                            <EditClientPage
                                onBackToList={() => navigate('/clients')}
                                onSuccess={(message) => {
                                    alert(message);
                                    navigate('/clients');
                                }}
                                onLogout={handleLogout}
                            />
                        </div>
                    }
                />

                {/* Case Management Routes */}
                <Route
                    path="/cases"
                    element={
                        <div className="flex-1 overflow-auto">
                            <CaseList
                                onAddCaseClick={() => navigate('/cases/add')}
                                onViewCase={(caseId: string) => navigate(`/cases/${caseId}`)}
                                onEditCase={(caseId: string) => navigate(`/cases/${caseId}/edit`)}
                                onDeleteCase={async (caseId: string) => {
                                    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
                                        const success = await handleDelete('cases', caseId, 'Case deleted successfully!');
                                        if (success) window.location.reload();
                                    }
                                }}
                                onLogout={handleLogout}
                            />
                        </div>
                    }
                />
                <Route
                    path="/cases/add"
                    element={
                        <AddCasePage
                            onBackToList={() => navigate('/cases')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/cases');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/cases/:id"
                    element={
                        <CaseDetailsPage
                            onBackToList={() => navigate('/cases')}
                            onEditCase={(caseId) => navigate(`/cases/${caseId}/edit`)}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/cases/:id/edit"
                    element={
                        <EditCasePage
                            onBackToList={() => navigate('/cases')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/cases');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />

                {/* Appointment Management Routes */}
                <Route
                    path="/appointments"
                    element={
                        <AppointmentListPage
                            onViewAppointment={(apptId) => navigate(`/appointments/${apptId}`)}
                            onEditAppointment={(apptId) => navigate(`/appointments/${apptId}/edit`)}
                            onDeleteAppointment={async (apptId) => {
                                if (window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
                                    const success = await handleDelete('appointments', apptId, 'Appointment deleted successfully!');
                                    if (success) window.location.reload();
                                }
                            }}
                            onAddAppointmentClick={() => navigate('/appointments/add')}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/appointments/add"
                    element={
                        <AddAppointmentPage
                            onBackToList={() => navigate('/appointments')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/appointments');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/appointments/:id"
                    element={
                        <AppointmentDetailsPage
                            onBackToList={() => navigate('/appointments')}
                            onEditAppointment={(apptId) => navigate(`/appointments/${apptId}/edit`)}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/appointments/:id/edit"
                    element={
                        <EditAppointmentPage
                            onBackToList={() => navigate('/appointments')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/appointments');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />

                {/* Task Management Routes */}
                <Route
                    path="/tasks"
                    element={
                        <TaskListPage
                            onAddTaskClick={() => navigate('/tasks/add')}
                            onViewTask={(taskId) => navigate(`/tasks/${taskId}`)}
                            onEditTask={(taskId) => navigate(`/tasks/${taskId}/edit`)}
                            onDeleteTask={async (taskId) => {
                                if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                                    const success = await handleDelete('tasks', taskId, 'Task deleted successfully!');
                                    if (success) window.location.reload();
                                }
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/tasks/add"
                    element={
                        <AddTaskPage
                            onBackToList={() => navigate('/tasks')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/tasks');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/tasks/:id"
                    element={
                        <TaskDetailsPage
                            onBackToList={() => navigate('/tasks')}
                            onEditTask={(taskId) => navigate(`/tasks/${taskId}/edit`)}
                            onDeleteTask={async (taskId) => {
                                if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                                    const success = await handleDelete('tasks', taskId, 'Task deleted successfully!');
                                    if (success) window.location.reload();
                                }
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/tasks/:id/edit"
                    element={
                        <EditTaskPage
                            onBackToList={() => navigate('/tasks')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/tasks');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />

                {/* Document Management Routes */}
                <Route
                    path="/documents"
                    element={
                        <DocumentList
                            onAddDocumentClick={() => navigate('/documents/add')}
                            onViewDocument={(docId) => navigate(`/documents/${docId}`)}
                            onEditDocument={(docId) => navigate(`/documents/${docId}/edit`)}
                            onDeleteDocument={async (docId) => {
                                if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                                    const success = await handleDelete('documents', docId, 'Document deleted successfully!');
                                    if (success) window.location.reload();
                                }
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/documents/add"
                    element={
                        <AddDocumentPage
                            onBackToList={() => navigate('/documents')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/documents');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/documents/:id"
                    element={
                        <DocumentDetailsPage
                            onBackToList={() => navigate('/documents')}
                            onEditDocument={(docId) => navigate(`/documents/${docId}/edit`)}
                            onDownloadDocument={async (docId) => {
                                try {
                                    const token = localStorage.getItem('authToken');
                                    if (!token) {
                                        alert('Authentication token not found. Please log in again.');
                                        handleLogout();
                                        return;
                                    }
                                    // Implementation for downloading document
                                    console.log('Downloading document:', docId);
                                } catch (error) {
                                    console.error('Error downloading document:', error);
                                    alert(`Failed to download document: ${(error as Error).message}. Please try again.`);
                                }
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/documents/:id/edit"
                    element={
                        <EditDocumentPage
                            onBackToList={() => navigate('/documents')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/documents');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />

                {/* Draft Management Routes */}
                <Route
                    path="/drafts"
                    element={
                        <DraftList
                            onAddDraftClick={() => navigate('/drafts/add')}
                            onViewDraft={(draftId) => navigate(`/drafts/${draftId}`)}
                            onEditDraft={(draftId) => navigate(`/drafts/${draftId}/edit`)}
                            onDeleteDraft={async (draftId) => {
                                if (window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                                    const success = await handleDelete('drafts', draftId, 'Draft deleted successfully!');
                                    if (success) window.location.reload();
                                }
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/drafts/add"
                    element={
                        <AddDraftPage
                            onBackToList={() => navigate('/drafts')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/drafts');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/drafts/:id"
                    element={
                        <DraftDetailsPage
                            onBackToList={() => navigate('/drafts')}
                            onEditDraft={(draftId) => navigate(`/drafts/${draftId}/edit`)}
                            onLogout={handleLogout}
                        />
                    }
                />
                <Route
                    path="/drafts/:id/edit"
                    element={
                        <EditDraftPage
                            onBackToList={() => navigate('/drafts')}
                            onSuccess={(message) => {
                                alert(message);
                                navigate('/drafts');
                            }}
                            onLogout={handleLogout}
                        />
                    }
                />

                {/* Notification Management Route */}
                <Route
                    path="/notifications"
                    element={
                        <NotificationList onLogout={handleLogout} />
                    }
                />
                <Route
                    path="/test-notifications"
                    element={
                        <NotificationTestPage />
                    }
                />

                {/* User Profile Route */}
                <Route
                    path="/profile"
                    element={
                        <UserProfilePage
                            userId={user?._id || ''}
                            onLogout={handleLogout}
                            onProfileUpdated={() => {
                                // Refresh user data after profile update
                                window.location.reload();
                            }}
                        />
                    }
                />

                {/* AI Chat Route */}
                <Route
                    path="/ai-chat"
                    element={
                        <AIChatPage
                            onLogout={handleLogout}
                        />
                    }
                />

            </Route>

            {/* Default redirect for the root path and unmatched paths */}
            <Route path="/" element={<Navigate to={user ? "/cases" : "/login"} replace />} />
            <Route path="*" element={<Navigate to={user ? "/cases" : "/login"} replace />} />
        </Routes>
    );
};

// Main App component to provide Router context
// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700">We're sorry, but an unexpected error occurred. Please try refreshing the page.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <AppContent />
          <NotificationComponent />
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;