
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Lock, 
  Unlock, 
  ArrowRight,
  Terminal,
  FileText
} from 'lucide-react';
import { RenewalIntent, AgentStatus, SLAMetrics, ExecutionReceipt } from '../types';
import { biteDecrypt } from '../services/biteService';

interface ExecutionSimProps {
  intent: RenewalIntent;
  onUpdate: (updated: RenewalIntent) => void;
  onReceipt: (receipt: ExecutionReceipt) => void;
}

const ExecutionSim: React.FC<ExecutionSimProps> = ({ intent, onUpdate, onReceipt }) => {
  const [step, setStep] = useState<'idle' | 'checking' | 'decrypting' | 'verifying' | 'completed' | 'failed'>('idle');
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runSimulation = async (passCondition: boolean) => {
    setStep('checking');
    addLog("Initializing condition check...");
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    
    const mockMetrics: SLAMetrics = {
      uptime: passCondition ? intent.condition.threshold + 0.05 : intent.condition.threshold - 1.2,
      period: 'last_30_days',
      timestamp: new Date().toISOString()
    };
    setMetrics(mockMetrics);
    
    if (mockMetrics.uptime < intent.condition.threshold) {
      addLog(`FAILED: SLA at ${mockMetrics.uptime.toFixed(2)}% (Threshold: ${intent.condition.threshold}%)`);
      setStep('failed');
      const failReceipt: ExecutionReceipt = {
        agent: "Akomi",
        subscription: "ENCRYPTED",
        condition: `SLA >= ${intent.condition.threshold}%`,
        conditionResult: 'FAIL',
        executed: false,
        reason: "SLA threshold not met. Decryption blocked.",
        timestamp: new Date().toISOString()
      };
      onReceipt(failReceipt);
      onUpdate({ ...intent, status: AgentStatus.BLOCKED });
      return;
    }

    addLog(`PASSED: SLA at ${mockMetrics.uptime.toFixed(2)}%`);
    setStep('decrypting');
    await new Promise(r => setTimeout(r, 1000));
    
    addLog("BITE v2 Threshold Reached. Requesting decryption key...");
    await new Promise(r => setTimeout(r, 1000));
    
    try {
      const decrypted = biteDecrypt(intent.encryptedPayload!);
      addLog(`Decrypted vendor: ${decrypted.vendor}`);
      addLog(`Verified amount: $${decrypted.maxPrice}`);
      
      setStep('verifying');
      addLog("Policy check: Price within cap. Vendor allowlisted.");
      await new Promise(r => setTimeout(r, 1000));
      
      setStep('completed');
      addLog("Transaction executed successfully.");
      const successReceipt: ExecutionReceipt = {
        agent: "Akomi",
        subscription: intent.subscription,
        condition: `SLA >= ${intent.condition.threshold}%`,
        conditionResult: 'PASS',
        executed: true,
        amount: intent.maxPrice,
        txHash: "0x" + Math.random().toString(16).slice(2),
        timestamp: new Date().toISOString()
      };
      onReceipt(successReceipt);
      onUpdate({ ...intent, status: AgentStatus.EXECUTED });
    } catch (e) {
      addLog("ERROR: Threshold decryption failed.");
      setStep('failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Agent Card */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{intent.subscription}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  intent.status === AgentStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                  intent.status === AgentStatus.EXECUTED ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {intent.status}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                {intent.status === AgentStatus.PENDING ? <Lock className="text-gray-400" /> : <Unlock className="text-[#004d4a]" />}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Condition</span>
                <span className="font-medium text-gray-900">SLA ≥ {intent.condition.threshold}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Encrypted Intent</span>
                <span className="font-mono text-[10px] text-gray-400 truncate w-32">{intent.encryptedPayload}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expires At</span>
                <span className="font-medium text-gray-900">{new Date(intent.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>

            {intent.status === AgentStatus.PENDING && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => runSimulation(true)}
                  disabled={step !== 'idle'}
                  className="flex items-center justify-center gap-2 bg-[#004d4a] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#003d3a] transition-all disabled:opacity-50"
                >
                  <Play size={16} />
                  Simulate Success
                </button>
                <button 
                  onClick={() => runSimulation(false)}
                  disabled={step !== 'idle'}
                  className="flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Simulate Failure
                </button>
              </div>
            )}
          </div>

          {metrics && (
            <div className={`p-4 rounded-xl border ${step === 'failed' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Latest Metrics</span>
                {step === 'failed' ? <XCircle size={18} className="text-red-500" /> : <CheckCircle2 size={18} className="text-green-500" />}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Uptime</p>
                  <p className={`text-2xl font-black ${step === 'failed' ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.uptime.toFixed(3)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Target: {intent.condition.threshold}%</p>
                  <p className="text-[10px] text-gray-400">{metrics.period}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Logs & Execution Status */}
        <div className="flex flex-col h-full space-y-4">
          <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden flex flex-col shadow-xl">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-300">Execution Log</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1">
              {logs.length === 0 && <p className="text-gray-600 italic">Awaiting trigger...</p>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[#004d4a] shrink-0">$</span>
                  <span className="text-gray-300 break-all">{log}</span>
                </div>
              ))}
              {step !== 'idle' && step !== 'completed' && step !== 'failed' && (
                <div className="flex items-center gap-3 animate-pulse">
                  <span className="text-[#004d4a] shrink-0">$</span>
                  <Loader2 size={12} className="text-[#004d4a] animate-spin" />
                  <span className="text-gray-500">Processing...</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
             <div className="flex items-center gap-3 mb-4">
               <FileText size={18} className="text-gray-400" />
               <span className="text-sm font-bold text-gray-700">Execution Status</span>
             </div>
             <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${step !== 'idle' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span className={`text-xs ${step !== 'idle' ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>SLA Check</span>
                  {step === 'failed' && <XCircle size={14} className="ml-auto text-red-500" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${['decrypting', 'verifying', 'completed'].includes(step) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span className={`text-xs ${['decrypting', 'verifying', 'completed'].includes(step) ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>BITE Decryption</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${step === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span className={`text-xs ${step === 'completed' ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>Final Payment</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionSim;
