import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import GavelLoading from './GavelLoading';
import { 
  Home, 
  FileText, 
  Calendar, 
  Users, 
  Bell, 
  UserCircle, 
  LogOut, 
  ClipboardList,
  Bot
} from 'lucide-react';
import axios from 'axios';

// Axios instance with auth token (assuming token is stored in localStorage)
const api = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Sidebar Component
const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const pathname = location.pathname;
  const isActive = useCallback((path) => pathname === path, [pathname]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [ripple, setRipple] = useState(null);
  const buttonRef = useRef(null);

  const handleLogout = async (e) => {
    try {
      // Create ripple effect
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      setRipple({
        width: size,
        height: size,
        left: x,
        top: y,
        show: true
      });
      
      // Add a delay to show the ripple animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show loading state
      setIsLoggingOut(true);
      
      // Add delay before actual logout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear token and call the logout function from AuthContext
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setRipple(null);
    }
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      const sidebarToggle = document.getElementById('sidebar-toggle');
      
      if (isOpen && sidebar && !sidebar.contains(event.target) && 
          (!sidebarToggle || !sidebarToggle.contains(event.target))) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Show loading overlay during logout
  if (isLoggingOut) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <GavelLoading size="lg" className="mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Signing out...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="sidebar"
      className={`fixed z-40 w-64 bg-[#1e293b] h-screen flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Close button for mobile */}
      <button 
        onClick={onClose}
        className="md:hidden absolute right-4 top-4 text-gray-500 hover:text-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="p-6 flex items-center space-x-3 border-b border-gray-700">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z"/>
          </svg>
        </div>
        <span className="text-lg font-semibold text-white">ADVOCY</span>
      </div>
      <div className="mt-1 flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-2 mt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</h3>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem 
            icon={<Home size={16} />} 
            text="Dashboard" 
            active={isActive('/dashboard')} 
            href="/dashboard"
          />

        </nav>
        
        <div className="px-6 py-3 mt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</h3>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem 
            icon={<FileText size={18} />} 
            text="Cases" 
            active={isActive('/cases')} 
            href="/cases"
          />
          <NavItem 
            icon={<FileText size={18} />} 
            text="Documents" 
            active={isActive('/documents')} 
            href="/documents"
          />
          <NavItem 
            icon={<Calendar size={18} />} 
            text="Calendar" 
            active={isActive('/calendar')} 
            href="/calendar"
          />
          <NavItem 
            icon={<Users size={18} />} 
            text="Clients" 
            active={isActive('/clients')} 
            href="/clients"
          />
        </nav>
        
        <div className="px-6 py-3 mt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work</h3>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem 
            icon={<ClipboardList size={18} />} 
            text="Tasks" 
            active={isActive('/tasks')} 
            href="/tasks"
          />
          <NavItem 
            icon={<Calendar size={18} />} 
            text="Appointments" 
            active={isActive('/appointments')} 
            href="/appointments"
          />
        </nav>

        <div className="px-6 py-3 mt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Assistant</h3>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem 
            icon={<Bot size={18} />} 
            text="AI Assistant" 
            active={isActive('/ai-assistant')} 
            href="/ai-assistant"
          />
        </nav>

        <div className="px-6 py-3 mt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</h3>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem 
            icon={<UserCircle size={18} />} 
            text="My Profile" 
            active={isActive('/profile')} 
            href="/profile"
          />

        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg group relative overflow-hidden transition-all duration-500 hover:bg-gradient-to-r from-red-500/10 to-red-600/10"
            disabled={isLoggingOut}
          >
            {ripple?.show && (
              <span 
                className="absolute bg-red-500/30 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ripple"
                style={{
                  width: `${ripple.width}px`,
                  height: `${ripple.height}px`,
                  left: `${ripple.left + ripple.width/2}px`,
                  top: `${ripple.top + ripple.height/2}px`,
                }}
                onAnimationEnd={() => setRipple(prev => ({ ...prev, show: false }))}
              />
            )}
            {/* Animated background effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            
            {/* Animated icon */}
            <div className="relative z-10">
              <LogOut 
                size={18} 
                className="mr-3 text-red-400 group-hover:text-red-300 transition-all duration-500 group-hover:scale-110 group-active:scale-95 group-hover:rotate-[-5deg]" 
              />
              <span className="absolute inset-0 rounded-full bg-red-400/20 group-hover:bg-red-400/30 opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-125 transition-all duration-500"></span>
            </div>
            
            {/* Text with sliding underline effect */}
            <div className="relative">
              <span className="relative z-10 text-red-400 font-medium group-hover:text-red-300 transition-all duration-300 group-hover:tracking-wider">
                Logout
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-500 ease-out"></span>
            </div>
            
            {/* Animated arrow */}
            <div className="ml-auto relative group-hover:translate-x-1 transition-transform duration-500">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:delay-100" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                  className="group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300 group-hover:delay-100"
                />
              </svg>
            </div>
            

          </button>
        </div>
      </div>
    </div>
  );
};

// NavItem Component
const NavItem = ({ icon, text, active, href }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.preventDefault();
    navigate(href);
  };
  
  return (
    <a 
      href={href}
      onClick={handleClick}
      className={`relative flex items-center px-4 py-2.5 text-sm font-normal rounded-md transition-all duration-200 cursor-pointer ${
        active 
          ? 'text-white bg-gray-700/50' 
          : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <div className="relative z-10 flex items-center">
        <span className="mr-3">{icon}</span>
        {text}
      </div>
    </a>
  );
};

// Header Component
const Header = ({ user }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user data from the backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data) {
          setUserData(response.data);
        }
      } catch (error) {
        // Handle 404 or other errors gracefully
        if (error.response && error.response.status === 404) {
          console.log('User profile endpoint not available, using default user data');
          // Set default user data if available from props
          if (user) {
            setUserData({
              name: user.name || 'User',
              email: user.email || '',
              role: user.role || 'user'
            });
          }
        } else {
          console.error('Failed to fetch user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Get user's initial from real name or fallback to 'U'
  const getUserInitial = () => {
    // First try to get from fetched user data
    if (userData?.first_name) return userData.first_name.charAt(0).toUpperCase();
    if (userData?.name) return userData.name.trim().charAt(0).toUpperCase();
    
    // Fallback to user prop if available
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.name) return user.name.trim().charAt(0).toUpperCase();
    
    return 'U';
  };
  
  // Get user's display name for tooltip
  const getDisplayName = () => {
    if (userData?.first_name) return userData.first_name;
    if (userData?.name) return userData.name.trim().split(' ')[0];
    if (user?.first_name) return user.first_name;
    if (user?.name) return user.name.trim().split(' ')[0];
    return 'User';
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const [countRes, notificationsRes] = await Promise.all([
        api.get('/notifications/unread/count'),
        api.get('/notifications')
      ]);
      
      setHasUnreadNotifications(countRes.data.count > 0);
      setNotifications(notificationsRes.data || []);
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Failed to fetch notifications:', err);
      }
    }
  };

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (!user) return;
    
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    
    if (newState && hasUnreadNotifications) {
      // Mark notifications as read when opening the dropdown
      api.post('/notifications/mark-all-as-read')
        .then(() => setHasUnreadNotifications(false))
        .catch(console.error);
    }
  };
  
  return (
    <div className="flex justify-end items-center px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="relative" ref={notificationRef}>
          <button 
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <Bell 
              size={20} 
              strokeWidth={hasUnreadNotifications ? 2.5 : 2} 
              className={hasUnreadNotifications ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} 
            />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <li key={notification._id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-100 text-center">
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center">
          <div 
            className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/profile')}
            title={getDisplayName()}
          >
            {getUserInitial()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Layout Component
const Layout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GavelLoading size="xl" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-aliceblue">
      {/* Sidebar Toggle Button - Always visible */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-4 top-4 z-30 p-2 rounded-md text-gray-700 bg-white shadow-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        {isSidebarOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto bg-aliceblue mt-16 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
