import React, { useState } from 'react';
import { ExecutionReceipt, RenewalIntent } from '../types';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, RefreshCw, ExternalLink } from 'lucide-react';

interface ExecutionResultPageProps {
  receipt: ExecutionReceipt;
  intent: RenewalIntent;
  onBack: () => void;
  onRetry: () => void;
  onViewReceipt: () => void;
}

const ExecutionResultPage: React.FC<ExecutionResultPageProps> = ({
  receipt,
  intent,
  onBack,
  onRetry,
  onViewReceipt
}) => {
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  const handleCopyTxHash = async () => {
    if (receipt.txHash) {
      await navigator.clipboard.writeText(receipt.txHash);
      setCopiedTxHash(true);
      setTimeout(() => setCopiedTxHash(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptData = {
      ...receipt,
      intentId: intent.id,
      subscription: intent.subscription,
      vendor: intent.vendor,
      maxPrice: intent.maxPrice,
      condition: intent.condition,
      guardrails: intent.guardrails
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-receipt-${receipt.timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isSuccess = receipt.executed;
  const isBlocked = !receipt.executed;

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
          
          {/* Result Status */}
          <div className={`rounded-lg p-6 mb-6 ${
            isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isSuccess ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isSuccess ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${
                  isSuccess ? 'text-green-900' : 'text-red-900'
                }`}>
                  {isSuccess ? 'Execution Successful' : 'Execution Blocked'}
                </h1>
                <p className={`text-lg ${
                  isSuccess ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isSuccess 
                    ? 'Your renewal has been successfully executed'
                    : 'The renewal was blocked due to policy constraints'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#004d4a]" />
            Execution Summary
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subscription</label>
              <p className="text-gray-900">{receipt.subscription}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor</label>
              <p className="text-gray-900">{receipt.agent}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Condition</label>
              <p className="text-gray-900">{receipt.condition}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Condition Result</label>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                receipt.conditionResult === 'PASS' 
                  ? 'text-green-600 bg-green-100' 
                  : 'text-red-600 bg-red-100'
              }`}>
                {receipt.conditionResult === 'PASS' ? '✅ PASS' : '❌ FAIL'}
              </span>
            </div>
            {receipt.amount && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="text-gray-900">${receipt.amount}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Execution Time</label>
              <p className="text-gray-900">{new Date(receipt.timestamp).toLocaleString()}</p>
            </div>
          </div>

          {receipt.reason && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <div className={`p-4 rounded-md ${
                isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  isSuccess ? 'text-green-800' : 'text-red-800'
                }`}>
                  {receipt.reason}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Guardrail Check Results */}
        {receipt.guardrailCheck && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#004d4a]" />
              Guardrail Check Results
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">Price Validation</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  receipt.guardrailCheck.priceValid 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                }`}>
                  {receipt.guardrailCheck.priceValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">Vendor Authorization</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  receipt.guardrailCheck.vendorAllowed 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                }`}>
                  {receipt.guardrailCheck.vendorAllowed ? '✅ Allowed' : '❌ Blocked'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">Execution Limit</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  receipt.guardrailCheck.withinLimit 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                }`}>
                  {receipt.guardrailCheck.withinLimit ? '✅ Within Limit' : '❌ Limit Exceeded'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {receipt.txHash && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-gray-900 font-mono">
                    {receipt.txHash.slice(0, 8)}...{receipt.txHash.slice(-8)}
                  </code>
                  <button
                    onClick={handleCopyTxHash}
                    className="text-[#004d4a] hover:text-[#003d3a]"
                  >
                    {copiedTxHash ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">Blockchain Explorer</span>
                <a
                  href={`https://etherscan.io/tx/${receipt.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#004d4a] hover:text-[#003d3a]"
                >
                  View Transaction
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#004d4a]" />
            Execution Receipt
          </h2>
          <div className="flex gap-3">
            <button
              onClick={onViewReceipt}
              className="flex items-center gap-2 px-4 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md"
            >
              <FileText size={16} />
              View Full Receipt
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <Download size={16} />
              Download Receipt
            </button>
          </div>
        </div>

        {/* Next Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
          <div className="flex gap-3">
            {isBlocked && (
              <button
                onClick={onRetry}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Retry Execution
              </button>
            )}
            <button
              onClick={() => window.open('/audit-trail', '_blank')}
              className="px-6 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md"
            >
              View Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionResultPage;