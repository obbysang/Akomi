import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { RenewalIntent, AgentStatus } from '../types';
import { createRenewalIntent } from '../services/agentService';

interface CreatePolicyProps {
  onCreated: (intent: RenewalIntent) => void;
}

interface FormErrors {
  name?: string;
  vendor?: string;
  maxPrice?: string;
  sla?: string;
}

const CreatePolicy: React.FC<CreatePolicyProps> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('');
  const [maxPrice, setMaxPrice] = useState('99');
  const [sla, setSla] = useState('99.9');
  const [vendorAllowlist, setVendorAllowlist] = useState('');
  const [maxExecutions, setMaxExecutions] = useState('1');
  const [renewalPeriod, setRenewalPeriod] = useState('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Subscription name is required';
    }
    
    if (!vendor.trim()) {
      newErrors.vendor = 'Vendor identity is required';
    }
    
    const priceNum = parseFloat(maxPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.maxPrice = 'Max price must be a positive number';
    }
    
    const slaNum = parseFloat(sla);
    if (isNaN(slaNum) || slaNum < 0 || slaNum > 100) {
      newErrors.sla = 'SLA threshold must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse allowlist from input
      const allowlist = vendorAllowlist 
        ? vendorAllowlist.split(',').map(v => v.trim().toLowerCase()).filter(v => v)
        : [];

      // Create renewal intent using the production agent service
      const { intent } = await createRenewalIntent({
        subscription: name.trim(),
        vendor: vendor.trim(),
        maxPrice: parseFloat(maxPrice),
        period: renewalPeriod as 'monthly' | 'yearly',
        slaThreshold: parseFloat(sla),
        slaWindowDays: 30,
        vendorAllowlist: allowlist.length > 0 ? allowlist : [vendor.trim().toLowerCase()],
        maxExecutions: parseInt(maxExecutions),
        timeoutHours: 72
      });
      
      // Set plaintext payload for display (in production, this would not be stored in plaintext)
      intent.plaintextPayload = JSON.stringify({
        subscription: name.trim(),
        vendor: vendor.trim(),
        maxPrice: parseFloat(maxPrice),
        period: renewalPeriod
      }, null, 2);
      
      onCreated(intent);
    } catch (error) {
      console.error('Failed to create policy:', error);
      setErrors({ name: 'Failed to create policy. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Renewal Agent</h1>
        <p className="text-gray-500">Define private conditions for your subscription renewal with BITE v2 encryption</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lock size={16} className="text-[#004d4a]" />
              Subscription Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                  placeholder="e.g. Analytics API Pro"
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">This will be encrypted with BITE v2</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Identity</label>
                <input 
                  type="text" 
                  value={vendor}
                  onChange={(e) => { setVendor(e.target.value); setErrors(prev => ({ ...prev, vendor: undefined })); }}
                  placeholder="e.g. CloudVendor Inc"
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all ${errors.vendor ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                  required
                />
                {errors.vendor && (
                  <p className="text-xs text-red-500 mt-1">{errors.vendor}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">This will be encrypted with BITE v2</p>
              </div>
            </div>
          </div>

          {/* Guardrails */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Guardrails
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-medium">$</span>
                  <input 
                    type="number" 
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setErrors(prev => ({ ...prev, maxPrice: undefined })); }}
                    className={`w-full pl-7 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all ${errors.maxPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                    required
                  />
                </div>
                {errors.maxPrice && (
                  <p className="text-xs text-red-500 mt-1">{errors.maxPrice}</p>
                )}
                <p className="text-xs text-amber-600 mt-1">Spend cap - protects against overcharging</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SLA Threshold (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={sla}
                  onChange={(e) => { setSla(e.target.value); setErrors(prev => ({ ...prev, sla: undefined })); }}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all ${errors.sla ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                  required
                />
                {errors.sla && (
                  <p className="text-xs text-red-500 mt-1">{errors.sla}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Minimum uptime required for renewal</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Renewal Period</label>
                <select 
                  value={renewalPeriod}
                  onChange={(e) => setRenewalPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">How often it renews</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Executions</label>
                <input 
                  type="number" 
                  value={maxExecutions}
                  onChange={(e) => setMaxExecutions(e.target.value)}
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Prevents duplicate charges</p>
              </div>
            </div>
          </div>

          {/* Vendor Allowlist */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Allowlist (optional)</label>
            <input 
              type="text" 
              value={vendorAllowlist}
              onChange={(e) => setVendorAllowlist(e.target.value)}
              placeholder="e.g. cloudvendor.com, api-service.io"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated list of allowed vendors. Defaults to the vendor specified above.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#004d4a] hover:bg-[#003d3a] disabled:bg-[#006666] text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Encrypting & Initializing...
              </>
            ) : (
              <>
                <Shield size={16} />
                Encrypt & Initialize Agent
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePolicy;
