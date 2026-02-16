import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CreatePolicy from './components/CreatePolicy';
import ExecutionSim from './components/ExecutionSim';
import LandingPage from './components/LandingPage';
import RenewalPolicyPage from './components/RenewalPolicyPage';
import EncryptionConfirmationPage from './components/EncryptionConfirmationPage';
import AgentStatusDashboard from './components/AgentStatusDashboard';
import ConditionCheckPage from './components/ConditionCheckPage';
import ExecutionResultPage from './components/ExecutionResultPage';
import ReceiptAuditTrailPage from './components/ReceiptAuditTrailPage';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './services/AuthContext';
import { policyApi, intentApi, executionApi, receiptApi, checkApiHealth } from './services/api';
import { RenewalIntent, ExecutionReceipt, AgentStatus, SLAMetrics, PolicyData } from './types';

interface ReceiptWithIntent extends ExecutionReceipt {
  intentId?: string;
}

const AppContent: React.FC = () => {
  // Skip auth for now - users can access app directly
  const isAuthenticated = true;
  const [apiConnected, setApiConnected] = useState(false);
  const [activeView, setActiveView] = useState<
    'landing' | 'create' | 'status' | 'policy' | 'encryption' | 'dashboard' | 'condition' | 'result' | 'audit'
  >('landing');
  const [intents, setIntents] = useState<RenewalIntent[]>([]);
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [activeIntent, setActiveIntent] = useState<RenewalIntent | null>(null);
  const [receipts, setReceipts] = useState<ReceiptWithIntent[]>([]);
  const [currentReceipt, setCurrentReceipt] = useState<ExecutionReceipt | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check API health on mount
  useEffect(() => {
    const checkApi = async () => {
      const connected = await checkApiHealth();
      setApiConnected(connected);
      console.log('API Health:', connected ? 'Connected' : 'Disconnected');
    };
    checkApi();
  }, []);

  // Load data from backend when app loads
  useEffect(() => {
    loadDataFromBackend();
  }, []);

  const loadDataFromBackend = async () => {
    setIsLoadingData(true);
    try {
      // Load policies from backend
      const policiesResult = await policyApi.getPolicies();
      if (policiesResult.success && policiesResult.data) {
        setPolicies(policiesResult.data);
      }

      // Load intents from backend
      const intentsResult = await intentApi.getIntents();
      if (intentsResult.success && intentsResult.data) {
        setIntents(intentsResult.data);
      }

      // Load receipts from backend
      const receiptsResult = await receiptApi.getReceipts();
      if (receiptsResult.success && receiptsResult.data) {
        setReceipts(receiptsResult.data);
      }
    } catch (error) {
      console.error('Failed to load data from backend:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

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
    setCurrentReceipt(receipt);
  };

  const handleConditionResult = (result: 'PASS' | 'FAIL', metrics?: SLAMetrics) => {
    if (metrics) {
      setSlaMetrics(metrics);
    }
  };

  const handleGetStarted = () => {
    setActiveView('landing');
  };

  const handleCreatePolicy = () => {
    setActiveView('policy');
  };

  const handleSavePolicy = (intent: RenewalIntent) => {
    setIntents([...intents, intent]);
    setActiveIntent(intent);
    setActiveView('encryption');
  };

  const handleConfirmEncryption = () => {
    if (activeIntent) {
      setActiveView('dashboard');
    }
  };

  const handleViewIntent = (intent: RenewalIntent) => {
    setActiveIntent(intent);
    setActiveView('condition');
  };

  const handleExecute = () => {
    if (activeIntent && slaMetrics) {
      // Simulate execution
      const receipt: ExecutionReceipt = {
        agent: activeIntent.vendor,
        subscription: activeIntent.subscription,
        condition: `${activeIntent.condition.type} ${activeIntent.condition.threshold}%`,
        conditionResult: 'PASS',
        executed: true,
        amount: activeIntent.maxPrice,
        txHash: `0x${Math.random().toString(36).substring(2, 15)}`,
        timestamp: new Date().toISOString(),
        reason: 'All conditions met and guardrails passed',
        guardrailCheck: {
          priceValid: true,
          vendorAllowed: true,
          withinLimit: true
        }
      };
      handleReceipt(receipt);
      setActiveView('result');
    }
  };

  const handleViewReceipt = (receipt: ExecutionReceipt) => {
    setCurrentReceipt(receipt);
    setActiveView('result');
  };

  const handleViewAuditTrail = () => {
    setActiveView('audit');
  };

  // Show loading while data is being fetched
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004d4a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 font-sans">
      <Sidebar 
        onNewAgent={() => setActiveView('create')} 
        activeView={activeView}
        onNavigate={setActiveView}
      />
      
      <main className="flex-1 flex flex-col bg-[#f9fafb] relative">
        {/* API Status Indicator */}
        {!apiConnected && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            API disconnected - running in offline mode
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeView === 'landing' && (
            <LandingPage onGetStarted={handleCreatePolicy} />
          )}

          {activeView === 'create' && (
            <CreatePolicy onCreated={handleCreated} />
          )}

          {activeView === 'policy' && (
            <RenewalPolicyPage
              onBack={() => setActiveView('landing')}
              onSavePolicy={handleSavePolicy}
            />
          )}

          {activeView === 'encryption' && activeIntent && (
            <EncryptionConfirmationPage
              intent={activeIntent}
              onBack={() => setActiveView('policy')}
              onConfirm={handleConfirmEncryption}
            />
          )}

          {activeView === 'dashboard' && (
            <AgentStatusDashboard
              intents={intents}
              receipts={receipts}
              onViewIntent={handleViewIntent}
              onToggleAgent={async (intentId) => {
                // Call backend API to toggle agent status
                try {
                  const result = await executionApi.triggerConditionCheck(intentId);
                  if (result.success && result.data) {
                    setIntents(intents.map(i => 
                      i.id === intentId 
                        ? { ...i, status: result.data!.intent.status }
                        : i
                    ));
                  }
                } catch (error) {
                  console.error('Failed to toggle agent:', error);
                  // Fallback to local toggle
                  setIntents(intents.map(i => 
                    i.id === intentId 
                      ? { ...i, status: i.status === AgentStatus.PENDING ? AgentStatus.BLOCKED : AgentStatus.PENDING }
                      : i
                  ));
                }
              }}
              onRefresh={loadDataFromBackend}
            />
          )}

          {activeView === 'condition' && activeIntent && (
            <ConditionCheckPage
              intent={activeIntent}
              onBack={() => setActiveView('dashboard')}
              onExecute={handleExecute}
              onConditionResult={handleConditionResult}
            />
          )}

          {activeView === 'result' && currentReceipt && activeIntent && (
            <ExecutionResultPage
              receipt={currentReceipt}
              intent={activeIntent}
              onBack={() => setActiveView('dashboard')}
              onRetry={() => {
                // Retry logic would go here
                console.log('Retrying execution...');
              }}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeView === 'audit' && (
            <ReceiptAuditTrailPage
              receipts={receipts}
              intents={intents}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeView === 'status' && activeIntent && (
            <ExecutionSim 
              intent={activeIntent} 
              onUpdate={handleUpdateIntent} 
              onReceipt={handleReceipt}
            />
          )}
        </div>

        {/* Receipts Section - Only show on certain views */}
        {(activeView === 'create' || activeView === 'status') && (
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Agent History & Receipts</h2>
              {receipts.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                  <p>No execution history yet. Create an agent and run a simulation to see receipts here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${receipt.executed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {receipt.executed ? '✓' : '✗'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{receipt.subscription}</p>
                            <p className="text-sm text-gray-500">{receipt.condition}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            receipt.executed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {receipt.executed ? 'Success' : 'Blocked'}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(receipt.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {receipt.guardrailCheck && (
                        <div className="text-xs text-gray-600">
                          <p>Guardrails: 
                            {receipt.guardrailCheck.priceValid ? '✓ Price' : '✗ Price'} • 
                            {receipt.guardrailCheck.vendorAllowed ? '✓ Vendor' : '✗ Vendor'} • 
                            {receipt.guardrailCheck.withinLimit ? '✓ Limit' : '✗ Limit'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Main App component with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
