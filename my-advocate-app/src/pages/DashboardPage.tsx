import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardPageProps {
  onLogout: () => void;
  userFirstName?: string;
  userUsername?: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  onLogout,
  userFirstName,
  userUsername,
}) => {
  const navigate = useNavigate();
  const userDisplayName = userFirstName || userUsername || 'User';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userDisplayName}!</h1>
        <p className="text-gray-600">Here's what's happening with your cases today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Cases</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Upcoming Hearings</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Tasks</h3>
          <p className="text-3xl font-bold text-yellow-600">5</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/drafting')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Legal Drafting</h3>
                <p className="text-sm text-gray-600">Generate legal documents and letters</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-gray-600">New document uploaded to <span className="font-medium">Smith vs. Johnson</span></p>
            <p className="text-sm text-gray-400">2 hours ago</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-gray-600">Upcoming hearing for <span className="font-medium">Doe Estate Case</span> tomorrow at 10:00 AM</p>
            <p className="text-sm text-gray-400">5 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
