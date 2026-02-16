
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CreatePolicy from './components/CreatePolicy';
import ExecutionSim from './components/ExecutionSim';
import { RenewalIntent, ExecutionReceipt, AgentStatus } from './types';
import { Clock, Share2, MoreHorizontal, Settings, Layout, Info } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'status'>('create');
  const [intents, setIntents] = useState<RenewalIntent[]>([]);
  const [activeIntent, setActiveIntent] = useState<RenewalIntent | null>(null);
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);

  const handleCreated = (intent: RenewalIntent) => {
    setIntents([...intents, intent]);
    setActiveIntent(intent);
    setActiveView('status');
  };

  const handleUpdateIntent = (updated: RenewalIntent) => {
    setIntents(intents.map(i => i.id === updated.id ? updated : i));
    setActiveIntent(updated);
  };

  const handleReceipt = (receipt: ExecutionReceipt) => {
    setReceipts([receipt, ...receipts]);
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 font-sans">
      <Sidebar 
        onNewAgent={() => setActiveView('create')} 
        activeView={activeView}
        onNavigate={setActiveView}
      />
      
      <main className="flex-1 flex flex-col bg-[#f9fafb] relative">
        {/* Top bar like image */}
        <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setActiveView('list')}
               className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
             >
               <Clock size={14} />
               Agent History
             </button>
          </div>
          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">
               <Settings size={14} />
               Configuration
             </button>
             <div className="flex gap-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600"><Share2 size={18} /></button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeView === 'create' && (
            <CreatePolicy onCreated={handleCreated} />
          )}

          {activeView === 'status' && activeIntent && (
            <ExecutionSim 
              intent={activeIntent} 
              onUpdate={handleUpdateIntent} 
              onReceipt={handleReceipt}
            />
          )}

          {activeView === 'list' && (
            <div className="max-w-5xl mx-auto py-12 px-6">
              <h2 className="text-2xl font-black text-gray-900 mb-8">Agent History & Receipts</h2>
              {receipts.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Clock size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No execution history</h3>
                  <p className="text-sm text-gray-500">Run an agent simulation to see your audit trail here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {receipts.map((receipt, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-2 rounded-lg ${receipt.executed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <Layout size={24} />
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${receipt.executed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {receipt.executed ? 'Success' : 'Blocked'}
                          </span>
                       </div>
                       <h4 className="text-lg font-bold text-gray-900 mb-1">{receipt.subscription}</h4>
                       <p className="text-xs text-gray-500 mb-4">{new Date(receipt.timestamp).toLocaleString()}</p>
                       
                       <div className="bg-gray-50 rounded-xl p-4 font-mono text-[10px] space-y-2 mb-4 overflow-hidden">
                          <p><span className="text-[#004d4a]">agent:</span> "{receipt.agent}"</p>
                          <p><span className="text-[#004d4a]">condition:</span> "{receipt.condition}"</p>
                          <p><span className="text-[#004d4a]">result:</span> "{receipt.conditionResult}"</p>
                          {receipt.executed && (
                            <>
                              <p><span className="text-[#004d4a]">amount:</span> {receipt.amount}</p>
                              <p><span className="text-[#004d4a]">txHash:</span> "{receipt.txHash}"</p>
                            </>
                          )}
                          {!receipt.executed && <p><span className="text-red-500">reason:</span> "{receipt.reason}"</p>}
                       </div>
                       
                       <button className="w-full py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">
                         View Details
                       </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Chat Input Style (Visual Polish) */}
        <div className="p-6 border-t border-gray-200 bg-white">
           <div className="max-w-4xl mx-auto">
              <div className="relative group">
                 <input 
                   disabled
                   type="text" 
                   placeholder="Akomi is monitoring your subscriptions in the background..."
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-5 px-6 text-sm text-gray-400 cursor-not-allowed group-hover:border-gray-300 transition-colors"
                 />
                 <div className="absolute right-3 top-3 flex items-center gap-2">
                    <button className="p-2.5 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><Info size={20} /></button>
                    <div className="bg-[#004d4a] p-2.5 rounded-xl text-white opacity-50"><MoreHorizontal size={20} /></div>
                 </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] text-gray-400">All interactions are private. AI-generated receipts are for audit purposes only. <a href="#" className="underline">Learn More</a></p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
