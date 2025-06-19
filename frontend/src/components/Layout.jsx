// Import necessary libraries
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import GavelLoading from './GavelLoading';
import SearchBar from './SearchBar';

import { 
  Home, 
  FileText, 
  Calendar, 
  Users, 
  Settings, 
  Bell, 
  Search, 
  UserCircle, 
  LogOut, 
  ClipboardList, 
  MessageSquareText, 
  Bot, 
  FileEdit
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
  const pathname = window.location.pathname;
  const isActive = (path) => pathname === path;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Add a small delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Clear token and call the logout function from AuthContext
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
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
      className={`fixed z-40 w-64 bg-white h-screen flex flex-col border-r border-gray-200 transition-transform duration-300 ease-in-out ${
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
      <div className="p-6 flex items-center space-x-3">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z"/>
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-900">ADVOCY</span>
      </div>
      <div className="mt-1 flex-1 flex flex-col overflow-y-auto">
        <div className="px-6 py-2">
          <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wider">Main</h3>
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
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wider">Manage</h3>
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
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wider">Work</h3>
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
          <NavItem 
            icon={<FileEdit size={18} />} 
            text="Drafts" 
            active={isActive('/drafts')} 
            href="/drafts"
          />
        </nav>

        <div className="px-6 py-3 mt-2">
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wider">AI Assistant</h3>
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
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wider">System</h3>
        </div>
        <nav className="px-2 space-y-1">
          <NavItem 
            icon={<Settings size={18} />} 
            text="Settings" 
            active={isActive('/settings')} 
            href="/settings"
          />
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 group transition-colors duration-200"
          >
            <LogOut size={18} className="mr-3 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
            <span className="text-gray-700 group-hover:text-red-600 transition-colors duration-200">
              Logout
            </span>
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
          ? 'text-white' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background highlight effect */}
      <div 
        className={`absolute inset-0 bg-black/90 rounded-md transition-all duration-200 ${
          active ? 'opacity-100' : isHovered ? 'opacity-10' : 'opacity-0'
        }`}
      />
      
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
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();

  // Fetch user data from the backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data) {
          setUserData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

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

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const res = await api.get('/notifications/unread/count');
        setHasUnreadNotifications(res.data.count > 0);
      } catch (err) {
        console.error('Failed to fetch unread notifications count', err);
      }
    };
    
    fetchUnreadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex-1 flex justify-end pr-4">
        <SearchBar />
      </div>
      <div className="flex items-center space-x-4">
        <button 
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          onClick={() => {
            if (hasUnreadNotifications) {
              setHasUnreadNotifications(false);
              // In a real app, you would also update the server that notifications were seen
              // api.post('/notifications/mark-as-read');
            }
          }}
        >
          <Bell className={`h-5 w-5 ${hasUnreadNotifications ? 'text-gray-900' : 'text-gray-600'}`} />
          {hasUnreadNotifications && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
          )}
        </button>
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
  const { user, isLoading: isAuthLoading } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [window.location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GavelLoading size="xl" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 mt-16 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
