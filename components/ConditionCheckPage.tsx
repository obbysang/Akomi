import React, { useState, useEffect } from 'react';
import { RenewalIntent, SLAMetrics } from '../types';
import { Clock, Activity, TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ConditionCheckPageProps {
  intent: RenewalIntent;
  onBack: () => void;
  onExecute: () => void;
  onConditionResult: (result: 'PASS' | 'FAIL', metrics?: SLAMetrics) => void;
}

const ConditionCheckPage: React.FC<ConditionCheckPageProps> = ({
  intent,
  onBack,
  onExecute,
  onConditionResult
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'PASS' | 'FAIL' | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  useEffect(() => {
    // Auto-check conditions on component mount
    performConditionCheck();
  }, [intent]);

  const performConditionCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    
    // Simulate API call to check SLA metrics
    setTimeout(() => {
      // Mock SLA data - in real implementation, this would come from an API
      const mockMetrics: SLAMetrics = {
        uptime: Math.random() * 10 + 90, // Random uptime between 90-100%
        period: `${intent.condition.windowDays} days`,
        timestamp: new Date().toISOString()
      };
      
      setSlaMetrics(mockMetrics);
      setLastCheckTime(new Date());
      
      // Check if condition is met
      const conditionMet = mockMetrics.uptime >= intent.condition.threshold;
      const result = conditionMet ? 'PASS' : 'FAIL';
      
      setCheckResult(result);
      onConditionResult(result, mockMetrics);
      setIsChecking(false);
    }, 2000); // Simulate 2 second API delay
  };

  const getStatusColor = (result: 'PASS' | 'FAIL' | null) => {
    switch (result) {
      case 'PASS':
        return 'text-green-600 bg-green-100';
      case 'FAIL':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (result: 'PASS' | 'FAIL' | null) => {
    switch (result) {
      case 'PASS':
        return <CheckCircle className="w-6 h-6" />;
      case 'FAIL':
        return <XCircle className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <RefreshCw size={20} className="rotate-180" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Condition Check</h1>
          <p className="text-gray-600">
            Evaluating renewal conditions for {intent.subscription}
          </p>
        </div>

        {/* Policy Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#004d4a]" />
            Policy Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subscription</label>
              <p className="text-gray-900">{intent.subscription}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor</label>
              <p className="text-gray-900">{intent.vendor}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Price</label>
              <p className="text-gray-900">${intent.maxPrice}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Period</label>
              <p className="text-gray-900 capitalize">{intent.period}</p>
            </div>
          </div>
        </div>

        {/* Condition Check */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#004d4a]" />
              SLA Condition Check
            </h2>
            <button
              onClick={performConditionCheck}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md disabled:opacity-50"
            >
              <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
              {isChecking ? 'Checking...' : 'Re-check'}
            </button>
          </div>

          {/* Current Check Status */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${getStatusColor(checkResult)}`}>
                {getStatusIcon(checkResult)}
                <span className="text-lg font-semibold">
                  {checkResult === 'PASS' ? 'Condition Met' : 
                   checkResult === 'FAIL' ? 'Condition Not Met' : 
                   'Checking Conditions...'}
                </span>
              </div>
            </div>

            {checkResult && (
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  {checkResult === 'PASS' 
                    ? '✅ All conditions have been satisfied. The agent is ready to execute.'
                    : '❌ Conditions have not been met. The agent will not execute.'}
                </p>
                {lastCheckTime && (
                  <p className="text-sm text-gray-500">
                    Last checked: {lastCheckTime.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SLA Metrics */}
          {slaMetrics && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">SLA Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {slaMetrics.uptime.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Current Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {intent.condition.threshold}%
                  </div>
                  <div className="text-sm text-gray-600">Required Threshold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {slaMetrics.period}
                  </div>
                  <div className="text-sm text-gray-600">Evaluation Period</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uptime Progress</span>
                  <span>{slaMetrics.uptime >= intent.condition.threshold ? '✅ Pass' : '❌ Fail'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      slaMetrics.uptime >= intent.condition.threshold ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(slaMetrics.uptime, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Condition Details */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#004d4a]" />
            Condition Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Condition Type</label>
              <p className="text-gray-900 capitalize">{intent.condition.type} Uptime</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Threshold</label>
              <p className="text-gray-900">{intent.condition.threshold}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Evaluation Window</label>
              <p className="text-gray-900">{intent.condition.windowDays} days</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Status</label>
              <p className={`font-medium ${
                checkResult === 'PASS' ? 'text-green-600' : 
                checkResult === 'FAIL' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {checkResult === 'PASS' ? 'Ready to Execute' : 
                 checkResult === 'FAIL' ? 'Blocked' : 
                 'Evaluating...'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
          <button
            onClick={onExecute}
            disabled={checkResult !== 'PASS'}
            className="px-6 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play size={20} />
            Execute Renewal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionCheckPage;