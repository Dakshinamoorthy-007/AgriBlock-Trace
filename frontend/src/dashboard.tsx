import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';
import MiddlemanDashboard from '@/components/dashboard/MiddlemanDashboard';
import ConsumerDashboard from '@/components/dashboard/ConsumerDashboard';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Not logged in — send to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'farmer':
      return <FarmerDashboard />;
    case 'middleman':
      return <MiddlemanDashboard />;
    case 'consumer':
      return <ConsumerDashboard />;
    case 'admin':
      // Placeholder until admin dashboard is built
      return <Navigate to="/" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard;