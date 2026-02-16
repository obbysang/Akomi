
import React, { useState } from 'react';
import { Send, Shield, Lock, CreditCard } from 'lucide-react';
import { RenewalIntent, AgentStatus } from '../types';
import { biteEncrypt } from '../services/biteService';

interface CreatePolicyProps {
  onCreated: (intent: RenewalIntent) => void;
}

const CreatePolicy: React.FC<CreatePolicyProps> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('');
  const [maxPrice, setMaxPrice] = useState('99');
  const [sla, setSla] = useState('99.9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !vendor) return;

    const newIntent: RenewalIntent = {
      id: Math.random().toString(36).substr(2, 9),
      subscription: name,
      vendor: vendor,
      maxPrice: parseFloat(maxPrice),
      period: 'monthly',
      condition: {
        type: 'sla',
        threshold: parseFloat(sla),
        windowDays: 30
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: AgentStatus.PENDING,
    };

    // Encrypt immediate intent
    newIntent.encryptedPayload = biteEncrypt(newIntent);
    onCreated(newIntent);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Renewal Agent</h1>
        <p className="text-gray-500">Define the private conditions for your subscription renewal.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Analytics API Pro"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Identity</label>
              <input 
                type="text" 
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. CloudVendor Inc"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Renewal Price ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SLA Threshold (%)</label>
              <input 
                type="number" 
                step="0.01"
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004d4a] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="bg-[#f0f9f9] p-4 rounded-xl flex items-start gap-4">
            <div className="bg-white p-2 rounded-lg text-[#004d4a]">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#004d4a] mb-1">Privacy Guarantee</p>
              <p className="text-xs text-[#004d4a] opacity-80 leading-relaxed">
                Your vendor and price details will be encrypted using BITE v2. Decryption only happens if the SLA conditions are verified on-chain.
              </p>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#004d4a] hover:bg-[#003d3a] text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-md shadow-teal-900/10"
          >
            <Shield size={20} />
            Encrypt & Initialize Agent
          </button>
        </form>
      </div>

      <div className="mt-8 flex items-center justify-center gap-8 text-gray-400">
        <div className="flex items-center gap-2">
          <CreditCard size={16} />
          <span className="text-sm">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={16} />
          <span className="text-sm">Privacy First</span>
        </div>
      </div>
    </div>
  );
};

export default CreatePolicy;
