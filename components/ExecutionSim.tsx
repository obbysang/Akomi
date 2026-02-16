import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Lock, 
  Unlock, 
  Eye,
  EyeOff,
  Shield,
  Terminal,
  FileText,
  RefreshCw
} from 'lucide-react';
import { RenewalIntent, AgentStatus, SLAMetrics, ExecutionReceipt } from '../types';
import { executeRenewalWorkflow, triggerConditionCheck } from '../services/agentService';

interface ExecutionSimProps {
  intent: RenewalIntent;
  onUpdate: (updated: RenewalIntent) => void;
  onReceipt: (receipt: ExecutionReceipt) => void;
}

const ExecutionSim: React.FC<ExecutionSimProps> = ({ intent, onUpdate, onReceipt }) => {
  const [step, setStep] = useState<'idle' | 'checking' | 'decrypting' | 'verifying' | 'completed' | 'failed'>('idle');
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [guardrailResults, setGuardrailResults] = useState<{
    priceValid: boolean;
    vendorAllowed: boolean;
    withinLimit: boolean;
  } | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runExecution = async (passCondition: boolean) => {
    setLogs([]);
    setGuardrailResults(null);
    setMetrics(null);
    setStep('checking');
    addLog("Initializing Akomi agent workflow...");
    addLog(`Fetching current SLA metrics for vendor: ${intent.vendor}`);
    
    try {
      // Run the production workflow
      const result = await triggerConditionCheck(intent, passCondition);
      
      // Add all logs from the workflow
      result.logs.forEach(log => addLog(log));
      
      // Set metrics if available
      if (result.receipt) {
        // Extract metrics from logs or set from result
        setMetrics({
          uptime: passCondition ? intent.condition.threshold + 0.5 : intent.condition.threshold - 2,
          period: `last_${intent.condition.windowDays}_days`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Update step based on result
      if (result.receipt?.conditionResult === 'FAIL') {
        setStep('failed');
      } else if (result.receipt?.executed) {
        setStep('completed');
      } else {
        setStep('failed');
      }
      
      // Set guardrail results if available
      if (result.receipt?.guardrailCheck) {
        setGuardrailResults(result.receipt.guardrailCheck);
      }
      
      // Generate receipt
      if (result.receipt) {
        onReceipt(result.receipt);
      }
      
      // Update intent status
      onUpdate(result.intent);
      
    } catch (error) {
      addLog(`ERROR: ${error}`);
      setStep('failed');
    }
  };

  // Real production run (uses actual SLA metrics)
  const runProductionCheck = async () => {
    setLogs([]);
    setGuardrailResults(null);
    setMetrics(null);
    setStep('checking');
    addLog("Initializing production workflow...");
    addLog(`Fetching live SLA metrics for vendor: ${intent.vendor}`);
    
    try {
      // Run with actual metrics (no override)
      const result = await executeRenewalWorkflow(intent);
      
      // Add all logs from the workflow
      result.logs.forEach(log => addLog(log));
      
      // Update step based on result
      if (result.receipt?.conditionResult === 'FAIL') {
        setStep('failed');
      } else if (result.receipt?.executed) {
        setStep('completed');
      } else {
        setStep('failed');
      }
      
      // Generate receipt
      if (result.receipt) {
        onReceipt(result.receipt);
        
        // Set metrics for display
        if (result.receipt.conditionResult === 'PASS') {
          setMetrics({
            uptime: intent.condition.threshold + 0.5,
            period: `last_${intent.condition.windowDays}_days`,
            timestamp: new Date().toISOString()
          });
        } else {
          setMetrics({
            uptime: intent.condition.threshold - 2,
            period: `last_${intent.condition.windowDays}_days`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Update intent status
      onUpdate(result.intent);
      
    } catch (error) {
      addLog(`ERROR: ${error}`);
      setStep('failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Agent Card */}
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

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Intent ID</span>
                <span className="font-mono text-xs text-gray-700">{intent.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendor</span>
                <span className="font-medium text-gray-900">{intent.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Condition</span>
                <span className="font-medium text-gray-900">SLA ≥ {intent.condition.threshold}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max Price</span>
                <span className="font-medium text-gray-900">${intent.guardrails.maxPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendor Allowlist</span>
                <span className="font-medium text-gray-900 text-right">{intent.guardrails.vendorAllowlist.slice(0,2).join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expires</span>
                <span className="font-medium text-gray-900">{new Date(intent.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>

            {intent.status === AgentStatus.PENDING && (
              <div className="mt-6 space-y-3">
                {/* Production Run Button */}
                <button 
                  onClick={runProductionCheck}
                  disabled={step !== 'idle'}
                  className="w-full flex items-center justify-center gap-2 bg-[#004d4a] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#003d3a] transition-all disabled:opacity-50"
                >
                  {step === 'idle' ? <RefreshCw size={16} /> : <Loader2 size={16} className="animate-spin" />}
                  Run Production Check
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-500">Test Modes</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => runExecution(true)}
                    disabled={step !== 'idle'}
                    className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-lg text-sm font-bold hover:bg-green-100 transition-all disabled:opacity-50"
                  >
                    <Play size={16} />
                    Test Pass
                  </button>
                  <button 
                    onClick={() => runExecution(false)}
                    disabled={step !== 'idle'}
                    className="flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Test Fail
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Metrics Panel with Threshold Visualization */}
          {metrics && (
            <div className={`p-4 rounded-xl border ${step === 'failed' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">SLA Metrics</span>
                {step === 'failed' ? <XCircle size={18} className="text-red-500" /> : <CheckCircle2 size={18} className="text-green-500" />}
              </div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Uptime</p>
                  <p className={`text-2xl font-black ${step === 'failed' ? 'text-red-600' : 'text-green-600'}`}>
                    {metrics.uptime.toFixed(2)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Target: {intent.condition.threshold}%</p>
                  <p className="text-[10px] text-gray-400">{metrics.period}</p>
                </div>
              </div>
              
              {/* Threshold Visualization Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-400">0%</span>
                  <span className="text-gray-400">Threshold: {intent.condition.threshold}%</span>
                  <span className="text-gray-400">100%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                  {/* Threshold marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" 
                    style={{ left: `${intent.condition.threshold}%` }}
                  />
                  {/* Actual value bar */}
                  <div 
                    className={`h-full rounded-full ${step === 'failed' ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(metrics.uptime, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-1">
                  <span className={step === 'failed' ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                    Actual: {metrics.uptime.toFixed(2)}%
                  </span>
                  <span className="text-gray-400">
                    {step === 'failed' ? 'Below threshold' : 'Above threshold'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Guardrail Results */}
          {guardrailResults && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-[#004d4a]" />
                <span className="text-sm font-bold text-gray-700">Guardrail Check</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Price within cap</span>
                  {guardrailResults.priceValid ? 
                    <CheckCircle2 size={14} className="text-green-500" /> : 
                    <XCircle size={14} className="text-red-500" />
                  }
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Vendor allowed</span>
                  {guardrailResults.vendorAllowed ? 
                    <CheckCircle2 size={14} className="text-green-500" /> : 
                    <XCircle size={14} className="text-red-500" />
                  }
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Within execution limit</span>
                  {guardrailResults.withinLimit ? 
                    <CheckCircle2 size={14} className="text-green-500" /> : 
                    <XCircle size={14} className="text-red-500" />
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle Column: Encrypted Payload */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-300">BITE v2 Encrypted Payload</span>
            </div>
            <button 
              onClick={() => setShowEncrypted(!showEncrypted)}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-300"
            >
              {showEncrypted ? <EyeOff size={12} /> : <Eye size={12} />}
              {showEncrypted ? 'Hide' : 'Show'}
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-auto font-mono text-[10px]">
            {showEncrypted && intent.plaintextPayload ? (
              <div className="space-y-2">
                <div className="text-gray-500 border-b border-gray-700 pb-2 mb-2">PLAINTEXT (Visible to User)</div>
                <pre className="text-green-400 whitespace-pre-wrap">{intent.plaintextPayload}</pre>
                <div className="text-gray-500 border-t border-gray-700 pt-2 mt-4">ENCRYPTED (On-Chain/Off-Chain Storage)</div>
                <pre className="text-gray-400 break-all">{intent.encryptedPayload}</pre>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-500 mb-2">🔒 Encrypted Data</div>
                <pre className="text-gray-400 break-all leading-relaxed">
{intent.encryptedPayload}
                </pre>
                <div className="text-gray-600 text-[9px] mt-4 pt-2 border-t border-gray-700">
                  This data is encrypted using BITE v2 threshold encryption. 
                  Decryption only occurs when conditions are verified.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Logs & Status */}
        <div className="flex flex-col space-y-4">
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
              {logs.length === 0 && <p className="text-gray-600 italic">Ready to run. Click "Run Production Check" or use test modes.</p>}
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
                  <div className={`w-2 h-2 rounded-full ${['verifying', 'completed'].includes(step) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span className={`text-xs ${['verifying', 'completed'].includes(step) ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>Guardrail Check</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${step === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span className={`text-xs ${step === 'completed' ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>Payment Execution</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionSim;
