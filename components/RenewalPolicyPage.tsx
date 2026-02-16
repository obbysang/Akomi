import React, { useState } from 'react';
import { RenewalIntent, RenewalCondition, PolicyGuardrails, AgentStatus } from '../types';
import { Shield, Clock, DollarSign, User, Calendar, Save, ArrowLeft } from 'lucide-react';

interface RenewalPolicyPageProps {
  onBack: () => void;
  onSavePolicy: (intent: RenewalIntent) => void;
  existingPolicy?: RenewalIntent;
}

const RenewalPolicyPage: React.FC<RenewalPolicyPageProps> = ({ 
  onBack, 
  onSavePolicy, 
  existingPolicy 
}) => {
  const [formData, setFormData] = useState({
    subscription: existingPolicy?.subscription || '',
    vendor: existingPolicy?.vendor || '',
    maxPrice: existingPolicy?.maxPrice || 0,
    period: existingPolicy?.period || 'monthly' as 'monthly' | 'yearly',
    conditionType: existingPolicy?.condition.type || 'sla' as 'sla',
    threshold: existingPolicy?.condition.threshold || 95,
    windowDays: existingPolicy?.condition.windowDays || 30,
    vendorAllowlist: existingPolicy?.guardrails.vendorAllowlist.join(', ') || '',
    maxExecutions: existingPolicy?.guardrails.maxExecutions || 1,
    timeoutHours: existingPolicy?.guardrails.timeoutHours || 24
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const condition: RenewalCondition = {
      type: formData.conditionType,
      threshold: formData.threshold,
      windowDays: formData.windowDays
    };

    const guardrails: PolicyGuardrails = {
      maxPrice: formData.maxPrice,
      vendorAllowlist: formData.vendorAllowlist.split(',').map(v => v.trim()).filter(v => v),
      maxExecutions: formData.maxExecutions,
      timeoutHours: formData.timeoutHours
    };

    const intent: RenewalIntent = {
      id: existingPolicy?.id || `intent-${Date.now()}`,
      subscription: formData.subscription,
      vendor: formData.vendor,
      maxPrice: formData.maxPrice,
      period: formData.period,
      condition,
      guardrails,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: AgentStatus.PENDING,
      encryptedPayload: existingPolicy?.encryptedPayload || '',
      plaintextPayload: existingPolicy?.plaintextPayload || ''
    };

    onSavePolicy(intent);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {existingPolicy ? 'Edit Renewal Policy' : 'Create Renewal Policy'}
          </h1>
          <p className="text-gray-600">
            Define the conditions and guardrails for your automated renewal agent
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#004d4a]" />
              Basic Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.subscription}
                  onChange={(e) => handleInputChange('subscription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  placeholder="e.g., Cloud Storage Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor}
                  onChange={(e) => handleInputChange('vendor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  placeholder="e.g., AWS, Google Cloud"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renewal Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => handleInputChange('period', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Renewal Conditions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#004d4a]" />
              Renewal Conditions
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SLA Threshold (%)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.threshold}
                  onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation Window (days)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.windowDays}
                  onChange={(e) => handleInputChange('windowDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Type
                </label>
                <select
                  value={formData.conditionType}
                  onChange={(e) => handleInputChange('conditionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                >
                  <option value="sla">SLA Uptime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guardrails */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#004d4a]" />
              Policy Guardrails
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Vendors (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.vendorAllowlist}
                  onChange={(e) => handleInputChange('vendorAllowlist', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  placeholder="e.g., AWS, Google Cloud, Microsoft Azure"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Executions
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxExecutions}
                    onChange={(e) => handleInputChange('maxExecutions', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout Hours
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.timeoutHours}
                    onChange={(e) => handleInputChange('timeoutHours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md flex items-center gap-2"
            >
              <Save size={20} />
              {existingPolicy ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenewalPolicyPage;