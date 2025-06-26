import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CreateCase from './pages/CreateCase';
import CaseDetails from './pages/CaseDetails';
import EditCase from './pages/EditCase';
import Documents from './pages/Documents.jsx';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import NewTask from './pages/NewTask';
import TaskDetails from './pages/TaskDetails';
import EditTask from './pages/EditTask';
import AppointmentsList from './pages/Appointmentlist';
import AppointmentDetails from './pages/appointmentdetails';
import AppointmentForm from './pages/AppointmentForm';
import AIChat from './pages/AIChat';

import Clients from './pages/Clients';
import AddClient from './pages/AddClient';
import ClientDetails from './pages/ClientDetails';
import EditClient from './pages/EditClient';

// Components
import GavelLoading from './components/GavelLoading';

// Set default axios config
axios.defaults.withCredentials = true;

// Create Auth Context
export const AuthContext = React.createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Debug: Log user state changes
  useEffect(() => {
    console.log('Auth state updated:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);
  
  // Use ref to store the latest logout function to avoid circular dependencies
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const logoutRef = useRef(() => {});
  
  // Check for existing token and validate it on component mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Validating token...');
        // Set axios default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Verify the token with the backend
          const verifyResponse = await axios.post('http://localhost:5000/api/auth/verify-token', { token });
          
          if (verifyResponse.data && verifyResponse.data.success && verifyResponse.data.user) {
            // Token is valid, set user data
            console.log('Token valid, user data:', verifyResponse.data.user);
            setUser(verifyResponse.data.user);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            console.log('Token validation failed or user data missing');
            throw new Error('Invalid token or user data');
          }
        } catch (verifyError) {
          console.error('Error during token validation:', verifyError);
          // If verify-token fails, try to get user data directly
          try {
            const userResponse = await axios.get('http://localhost:5000/api/auth/me');
            if (userResponse.data && userResponse.data.user) {
              console.log('Fetched user data directly:', userResponse.data.user);
              setUser(userResponse.data.user);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          } catch (meError) {
            console.error('Error fetching user data:', meError);
          }
          
          // If we get here, both methods failed
          throw new Error('Could not validate token or fetch user data');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, []);
  
  // Set up axios interceptors for loading state and auth
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        setIsLoading(true);
        // Add auth token to requests if it exists
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        setIsLoading(false);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => {
        setIsLoading(false);
        return response;
      },
      error => {
        setIsLoading(false);
        
        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
          // If token is invalid, log the user out
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = useCallback((userData, token) => {
    if (!token) {
      console.error('No token provided for login');
      throw new Error('No authentication token provided');
    }
    
    try {
      // Store token and set auth header
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Format user data consistently
      const user = {
        id: userData._id || userData.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName || userData.first_name || '',
        lastName: userData.lastName || userData.last_name || '',
        role: userData.role || 'user',
        ...userData
      };
      
      console.log('Setting user data in auth context:', user);
      
      // Update auth state
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('Login successful, user authenticated:', user.username);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial state on error
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('Logging out user...');
      
      // Clear token from storage and headers
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Reset auth state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    // Always redirect to login page
    window.location.href = '/login';
  }, []);

  
  // Update the ref whenever logout changes
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Function to update user data in the context
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    
    // Format user data consistently
    const updatedUser = {
      id: userData._id || userData.id,
      username: userData.username || user?.username,
      email: userData.email || user?.email,
      firstName: userData.firstName || userData.first_name || user?.firstName || '',
      lastName: userData.lastName || userData.last_name || user?.lastName || '',
      role: userData.role || user?.role || 'user',
      ...userData,
      // Preserve existing user properties that aren't being updated
      ...(user || {})
    };
    
    console.log('Updating user context with:', updatedUser);
    setUser(updatedUser);
    return updatedUser;
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user,
      login, 
      logout,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = React.useContext(AuthContext);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <GavelLoading size="lg" className="mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we prepare your content</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = React.useContext(AuthContext);
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
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
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/new" element={<CreateCase />} />
              <Route path="/cases/:id" element={<CaseDetails />} />
              <Route path="/cases/:id/edit" element={<EditCase />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/new" element={<NewTask />} />
              <Route path="/tasks/:id" element={<TaskDetails />} />
              <Route path="/tasks/edit/:id" element={<EditTask />} />
              <Route path="/appointments" element={<AppointmentsList />} />
              <Route path="/appointments/new" element={<AppointmentForm />} />
              <Route path="/appointments/:id" element={<AppointmentDetails />} />
              <Route path="/appointments/:id/edit" element={<AppointmentForm />} />

              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/new" element={<AddClient />} />
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/clients/:id/edit" element={<EditClient />} />
              
              {/* AI Assistant Route */}
              <Route path="/ai-assistant" element={<AIChat />} />
             
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
