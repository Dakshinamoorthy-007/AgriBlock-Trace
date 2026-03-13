import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';
import MiddlemanDashboard from '@/components/dashboard/MiddlemanDashboard';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogIn } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
          <div className="text-center">
            <LogIn className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {language === 'en' ? 'Login Required' : 'உள்நுழைவு தேவை'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === 'en'
                ? 'Please login to access your dashboard'
                : 'உங்கள் டாஷ்போர்டை அணுக உள்நுழையவும்'}
            </p>
            <Button onClick={() => navigate('/login')}>
              {language === 'en' ? 'Go to Login' : 'உள்நுழைவுக்கு செல்'}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return user?.role === 'farmer' ? <FarmerDashboard /> : <MiddlemanDashboard />;
};

export default Dashboard;
