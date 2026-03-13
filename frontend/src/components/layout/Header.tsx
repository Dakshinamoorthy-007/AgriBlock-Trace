import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translations, t } from '@/lib/translations';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Government-style top bar */}
      <div className="govt-header">
        <span className="text-xs md:text-sm">
          {t('governmentOf', language)} | {language === 'en' ? translations.governmentOf.ta : translations.governmentOf.en}
        </span>
      </div>

      {/* Main header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  {t('appName', language)}
                </span>
                <span className="text-[10px] text-muted-foreground font-tamil">
                  {translations.appName.ta}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('home', language)}
              </Link>
              <Link 
                to="/trace" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('trace', language)}
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('dashboard', language)}
                </Link>
              )}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="rounded-full"
                title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
              >
                <Globe className="h-5 w-5" />
                <span className="ml-1 text-xs font-semibold">
                  {language === 'en' ? 'த' : 'EN'}
                </span>
              </Button>

              {/* Auth buttons */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      ({t(user?.role as any, language)})
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="hidden md:flex"
                  onClick={() => navigate('/login')}
                >
                  {t('login', language)}
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 animate-fade-in">
              <nav className="flex flex-col gap-2">
                <Link 
                  to="/" 
                  className="px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('home', language)}
                </Link>
                <Link 
                  to="/trace" 
                  className="px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('trace', language)}
                </Link>
                {isAuthenticated && (
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('dashboard', language)}
                  </Link>
                )}
                {isAuthenticated ? (
                  <button 
                    className="px-4 py-3 text-base font-medium text-left rounded-lg hover:bg-muted transition-colors text-destructive"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t('logout', language)}
                  </button>
                ) : (
                  <Link 
                    to="/login" 
                    className="px-4 py-3 text-base font-medium rounded-lg bg-primary text-primary-foreground text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login', language)}
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
