import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CreateCase from './pages/CreateCase';
import CaseDetails from './pages/CaseDetails';
import EditCase from './pages/EditCase';

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
  logout: () => {}
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
  
  // Check for existing token and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Here you would typically validate the token with your backend
        // For now, we'll just check if it exists and is a valid JWT format
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Set axios default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user profile data after successful token validation
        try {
          const userResponse = await axios.get('http://localhost:5000/api/auth/me');
          if (userResponse.data.success) {
            console.log('Setting user data:', userResponse.data.user); // Debug log
            setUser(userResponse.data.user);
          } else {
            console.error('Failed to fetch user profile:', userResponse.data.message);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Don't log out on profile fetch error, just continue with limited functionality
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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

  const login = useCallback(async ({ token, userData }) => {
    console.log('Login called with:', { token, userData });
    
    if (!token) {
      console.error('No token provided to login function');
      return;
    }
    
    try {
      // Store token and update auth state
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // If user data is provided, use it
      if (userData) {
        console.log('Setting user data from login response:', userData);
        const user = {
          id: userData._id || userData.id,
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName || userData.first_name,
          lastName: userData.lastName || userData.last_name,
          role: userData.role,
          // Include all other user data
          ...userData
        };
        console.log('Setting user in state:', user);
        setUser(user);
      } else {
        // If no user data, fetch it from the server
        const fetchUser = async () => {
          try {
            const response = await axios.get('http://localhost:5000/api/auth/me');
            if (response.data.success) {
              console.log('Fetched user data:', response.data.user);
              setUser(response.data.user);
            } else {
              throw new Error('Failed to fetch user profile');
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If we can't get user data, log the user out using the ref
            logoutRef.current();
          }
        };
        fetchUser();
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error so the caller can handle it
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    
    // Optionally call backend logout endpoint
    // axios.post('/api/auth/logout');
  }, []);
  
  // Update the ref whenever logout changes
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
