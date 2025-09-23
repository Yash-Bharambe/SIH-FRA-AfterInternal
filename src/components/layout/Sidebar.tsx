import React from 'react';
import { 
  Home, 
  FileText, 
  Map, 
  Brain, 
  Landmark, 
  Shield,
  ChevronRight,
  TreePine,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userType: 'employee' | 'public';
  isMinimized: boolean;
  onMinimizeToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  userType,
  isMinimized,
  onMinimizeToggle
}) => {
  
  const employeeMenuItems = [
    { id: 'dashboard', label: 'Admin Panel', icon: Shield },
    { id: 'fra-atlas', label: 'FRA Atlas', icon: Map },
    { id: 'documents', label: 'Document Review', icon: FileText },
    { id: 'asset-mapping', label: 'AI Asset Mapping', icon: Brain },
    { id: 'schemes', label: 'DSS Schemes', icon: Landmark },
  ];

  const publicMenuItems = [
    { id: 'dashboard', label: 'My Claims', icon: Home },
    { id: 'submit-claim', label: 'Submit Claim', icon: FileText },
    { id: 'fra-atlas', label: 'FRA Atlas', icon: Map },
    { id: 'asset-mapping', label: 'AI Asset Mapping', icon: Brain },
    { id: 'schemes', label: 'DSS Schemes', icon: Landmark },
  ];

  const menuItems = userType === 'employee' ? employeeMenuItems : publicMenuItems;

  return (
    <aside className={`fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-white border-r border-forest-sage/20 shadow-sm transition-all duration-300 ease-in-out z-10 ${
      isMinimized ? 'w-20' : 'w-72'
    }`}>
      <div className={`p-6 ${isMinimized ? 'px-3' : ''}`}>
        {/* Minimize Button */}
        <button
          onClick={onMinimizeToggle}
          className="absolute right-0 -mr-3 top-8 bg-white p-1.5 rounded-full shadow-lg border border-forest-sage/20 hover:bg-forest-sage/5 transition-all duration-300 hover:scale-110 group z-50"
        >
          {isMinimized ? (
            <PanelLeftOpen className="h-4 w-4 text-forest-medium" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-forest-medium" />
          )}
        </button>

        {/* Sidebar Header */}
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'space-x-3'} mb-8`}>
          <div className="p-2 bg-forest-gradient rounded-xl shadow-lg">
            <TreePine className="h-6 w-6 text-white" />
          </div>
          {!isMinimized && (
            <div>
              <h2 className="text-lg font-bold text-forest-deep">Navigation</h2>
              <p className="text-xs text-forest-medium">
                {userType === 'employee' ? 'Admin Dashboard' : 'Public Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'forest-sidebar-item-active'
                    : 'forest-sidebar-item hover:bg-forest-sage/10'
                }`}
                title={isMinimized ? item.label : undefined}
              >
                <div className={`flex items-center ${isMinimized ? 'justify-center' : 'space-x-3'} ${isMinimized ? 'w-full' : ''}`}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-forest-gradient shadow-lg' 
                      : 'bg-forest-sage/20 group-hover:bg-forest-sage/30'
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-forest-medium group-hover:text-forest-deep'
                    }`} />
                  </div>
                  {!isMinimized && (
                    <span className={`font-medium transition-colors duration-300 ${
                      isActive ? 'text-forest-deep' : 'text-forest-dark group-hover:text-forest-deep'
                    }`}>
                      {item.label}
                    </span>
                  )}
                </div>
                
                {isActive && !isMinimized && (
                  <ChevronRight className="h-4 w-4 text-forest-medium animate-forest-bounce" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!isMinimized && (
          <div className="mt-12 p-4 bg-forest-sage/10 rounded-xl border border-forest-sage/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-forest-pulse"></div>
              <span className="text-sm font-semibold text-forest-deep">System Status</span>
            </div>
            <p className="text-xs text-forest-medium">
              All systems operational
            </p>
            <div className="mt-2 text-xs text-forest-medium">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};