
import React from 'react';
import { 
  Plus, 
  Search, 
  Layout, 
  BookOpen, 
  Link2, 
  Home, 
  ChevronDown, 
  Folder, 
  Settings, 
  HelpCircle,
  User
} from 'lucide-react';

interface SidebarProps {
  onNewAgent: () => void;
  activeView: 'list' | 'create' | 'status';
  onNavigate: (view: 'list' | 'create' | 'status') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewAgent, activeView, onNavigate }) => {
  return (
    <div className="w-[300px] bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-gap-2">
          <div className="w-8 h-8 bg-[#004d4a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AK</span>
          </div>
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
        <button className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm hover:bg-gray-50">
          <BookOpen size={18} className="text-gray-500" />
          <span>Templates</span>
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto mt-4">
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <span>Recents</span>
            <ChevronDown size={14} />
          </div>
          <div className="space-y-1">
             <button 
               onClick={() => onNavigate('list')}
               className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${activeView === 'list' ? 'bg-gray-100 text-[#004d4a]' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <Layout size={16} />
               <span>Agent History</span>
             </button>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            <span>Projects</span>
            <Plus size={14} />
          </div>
          <div className="space-y-1">
            <div className="group">
              <div className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Folder size={16} className="text-[#8c52ff]" />
                  <span>Subscription Renewal</span>
                </div>
                <ChevronDown size={14} />
              </div>
              <div className="pl-9 mt-1 space-y-1">
                <div className="text-sm py-1.5 text-[#004d4a] font-medium border-l-2 border-[#004d4a] pl-4">Analytics Pro</div>
                <div className="text-sm py-1.5 text-gray-500 hover:text-gray-800 pl-4 cursor-pointer">Storage SLA</div>
                <div className="text-sm py-1.5 text-gray-500 hover:text-gray-800 pl-4 cursor-pointer">Compute Agent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Upgrade */}
      <div className="p-4 mt-auto">
        <div className="bg-[#f0f9f9] p-4 rounded-xl mb-4 text-center">
          <p className="text-xs text-[#004d4a] font-semibold mb-2">Unlock More Power with a Growth Plan</p>
          <button className="w-full bg-white text-[#004d4a] border border-[#004d4a] py-1.5 rounded-full text-xs font-bold hover:bg-teal-50">
            Upgrade to Growth
          </button>
        </div>
        
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
             <img src="https://picsum.photos/id/64/32/32" alt="User" />
           </div>
           <div className="flex-1">
             <p className="text-xs font-bold text-gray-800">Dev User</p>
           </div>
           <Settings size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
