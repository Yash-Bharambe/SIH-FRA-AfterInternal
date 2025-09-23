import React, { useState, useEffect } from 'react';
import { TreePine, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onSectionChange }) => {
  const { logout, userType } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
          : 'bg-white'
      } border-b border-forest-sage/10 h-16`}
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-full">
          {/* Logo and Website Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onSectionChange('dashboard')}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              scrolled ? 'bg-forest-sage/5' : ''
            }`}>
              <TreePine className="h-6 w-6 text-forest-deep" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-forest-deep">Forest Rights Act</h1>
              <span className="text-xs text-forest-medium">Digital Management System</span>
            </div>
          </div>

          {/* Navigation Status */}
          <div className="hidden md:block">
            <span className="text-sm text-forest-medium capitalize">
              {activeSection.replace('-', ' ')}
            </span>
          </div>

          {/* Profile and Logout */}
          <div className="flex items-center">
            {/* Desktop View */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-3 py-1.5 bg-forest-sage/5 rounded-full">
                <User className="h-4 w-4 text-forest-deep" />
                <span className="text-sm font-medium text-forest-deep">
                  {userType === 'employee' ? 'Administrator' : 'Public User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-1.5 text-forest-medium hover:text-forest-deep hover:bg-forest-sage/5 rounded-full transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-forest-medium hover:text-forest-deep hover:bg-forest-sage/5 rounded-full transition-all duration-300"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 right-0 w-64 bg-white/95 backdrop-blur-sm z-50 border-l border-b border-forest-sage/10 rounded-bl-2xl shadow-lg">
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3 px-3 py-2 bg-forest-sage/5 rounded-xl">
              <User className="h-4 w-4 text-forest-deep" />
              <span className="text-sm font-medium text-forest-deep">
                {userType === 'employee' ? 'Administrator' : 'Public User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-3 py-2 text-forest-medium hover:text-forest-deep hover:bg-forest-sage/5 rounded-xl transition-all duration-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};