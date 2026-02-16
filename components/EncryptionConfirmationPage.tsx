import React, { useState } from 'react';
import { RenewalIntent } from '../types';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Copy, Download } from 'lucide-react';

interface EncryptionConfirmationPageProps {
  intent: RenewalIntent;
  onConfirm: () => void;
  onBack: () => void;
}

const EncryptionConfirmationPage: React.FC<EncryptionConfirmationPageProps> = ({ 
  intent, 
  onConfirm, 
  onBack 
}) => {
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEncrypted = async () => {
    if (intent.encryptedPayload) {
      await navigator.clipboard.writeText(intent.encryptedPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptData = {
      intentId: intent.id,
      subscription: intent.subscription,
      vendor: intent.vendor,
      maxPrice: intent.maxPrice,
      period: intent.period,
      condition: intent.condition,
      guardrails: intent.guardrails,
      encryptedPayload: intent.encryptedPayload,
      timestamp: new Date().toISOString(),
      encryptionMethod: 'BITE v2'
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encryption-receipt-${intent.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <AlertCircle size={20} />
            <span>Back to Policy</span>
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Encryption Confirmed</h1>
              <p className="text-gray-600">Your renewal policy has been encrypted with BITE v2</p>
            </div>
          </div>
        </div>

        {/* Encryption Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">Encryption Successful</h2>
          </div>
          <p className="text-green-800 mb-4">
            Your renewal policy has been successfully encrypted using BITE v2 encryption. 
            The encrypted payload ensures that your policy conditions remain private and secure.
          </p>
          <div className="bg-white rounded-md p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Encryption Method:</span>
              <span className="text-sm font-mono text-green-700">BITE v2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Policy ID:</span>
              <span className="text-sm font-mono text-gray-600">{intent.id}</span>
            </div>
          </div>
        </div>

        {/* Encrypted Payload */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#004d4a]" />
              Encrypted Policy Payload
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopyEncrypted}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Copy size={16} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md transition-colors"
              >
                <Download size={16} />
                Download Receipt
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-4 font-mono text-sm break-all text-gray-700">
            {intent.encryptedPayload || 'Encrypted payload will be generated here...'}
          </div>
        </div>

        {/* Policy Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Policy Summary</h2>
            <button
              onClick={() => setShowPlaintext(!showPlaintext)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {showPlaintext ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPlaintext ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {showPlaintext && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Renewal Conditions</label>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-700">
                    SLA Threshold: {intent.condition.threshold}% uptime over {intent.condition.windowDays} days
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guardrails</label>
                <div className="bg-gray-50 rounded-md p-3 space-y-1">
                  <p className="text-sm text-gray-700">Max Executions: {intent.guardrails.maxExecutions}</p>
                  <p className="text-sm text-gray-700">Timeout: {intent.guardrails.timeoutHours} hours</p>
                  <p className="text-sm text-gray-700">Allowed Vendors: {intent.guardrails.vendorAllowlist.join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Security Notice</h3>
              <p className="text-sm text-blue-800">
                Your encrypted policy is now ready for deployment. The BITE v2 encryption ensures that:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Policy conditions remain private during execution</li>
                <li>• Only authorized agents can decrypt and execute</li>
                <li>• Full audit trail maintains transparency</li>
                <li>• Guardrails prevent unauthorized actions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Policy
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md flex items-center gap-2"
          >
            <CheckCircle size={20} />
            Deploy Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncryptionConfirmationPage;