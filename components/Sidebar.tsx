import React from 'react';
import { 
  Plus, 
  Layout,
  Home,
  Shield,
  Activity,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';

interface SidebarProps {
  onNewAgent: () => void;
  activeView: 'landing' | 'create' | 'status' | 'policy' | 'encryption' | 'dashboard' | 'condition' | 'result' | 'audit';
  onNavigate: (view: 'landing' | 'create' | 'status' | 'policy' | 'encryption' | 'dashboard' | 'condition' | 'result' | 'audit') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewAgent, activeView, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-gap-2">
          <img 
            src="/assets/Akomi.png" 
            alt="Akomi Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="ml-3 font-semibold text-lg text-[#004d4a]">Akomi</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 space-y-3">
        <button 
          onClick={onNewAgent}
          className="w-full bg-[#004d4a] hover:bg-[#003d3a] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          <span>New Agent</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto mt-4">
        <div className="px-4 mb-6">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <span>Navigation</span>
          </div>
          <div className="space-y-1">
            <button 
              onClick={() => onNavigate('landing')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'landing' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={16} />
              <span>Home</span>
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'dashboard' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={16} />
              <span>Agent Dashboard</span>
            </button>
            <button 
              onClick={() => onNavigate('create')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'create' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Layout size={16} />
              <span>Create Policy</span>
            </button>
            <button 
              onClick={() => onNavigate('audit')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'audit' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={16} />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <span>Quick Actions</span>
          </div>
          <div className="space-y-1">
            <button 
              onClick={() => onNavigate('policy')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'policy' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield size={16} />
              <span>Renewal Policy</span>
            </button>
            <button 
              onClick={() => onNavigate('condition')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'condition' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Activity size={16} />
              <span>Condition Check</span>
            </button>
            <button 
              onClick={() => onNavigate('result')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${
                activeView === 'result' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={16} />
              <span>Execution Result</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-gray-100">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 bg-[#004d4a] rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
        
        <div className="mt-3 text-xs text-gray-400 text-center">
          <p>BITE v2 Encrypted</p>
          <p>Private Conditional Execution</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
