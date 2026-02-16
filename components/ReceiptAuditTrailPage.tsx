import React, { useState } from 'react';
import { ExecutionReceipt, RenewalIntent } from '../types';
import { FileText, Download, Filter, Calendar, Search, ExternalLink, Copy, Eye } from 'lucide-react';

interface ReceiptAuditTrailPageProps {
  receipts: ExecutionReceipt[];
  intents: RenewalIntent[];
  onViewReceipt: (receipt: ExecutionReceipt) => void;
}

const ReceiptAuditTrailPage: React.FC<ReceiptAuditTrailPageProps> = ({
  receipts,
  intents,
  onViewReceipt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'blocked'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.subscription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.agent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'success' && receipt.executed) ||
                         (statusFilter === 'blocked' && !receipt.executed);
    const matchesDate = !dateFilter || 
                       new Date(receipt.timestamp).toDateString() === new Date(dateFilter).toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCopyTxHash = async (txHash: string) => {
    await navigator.clipboard.writeText(txHash);
    setCopiedHash(txHash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Timestamp', 'Subscription', 'Vendor', 'Condition', 'Result', 'Amount', 'Transaction Hash'].join(','),
      ...filteredReceipts.map(receipt => [
        new Date(receipt.timestamp).toISOString(),
        `"${receipt.subscription}"`,
        `"${receipt.agent}"`,
        `"${receipt.condition}"`,
        receipt.executed ? 'SUCCESS' : 'BLOCKED',
        receipt.amount || '',
        receipt.txHash || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalReceipts: filteredReceipts.length,
      receipts: filteredReceipts.map(receipt => ({
        ...receipt,
        intent: intents.find(i => i.subscription === receipt.subscription)
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: filteredReceipts.length,
    successful: filteredReceipts.filter(r => r.executed).length,
    blocked: filteredReceipts.filter(r => !r.executed).length,
    totalAmount: filteredReceipts
      .filter(r => r.executed && r.amount)
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Receipt & Audit Trail</h1>
          <p className="text-gray-600">
            Complete transparency and audit trail for all agent executions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocked</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by subscription or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="blocked">Blocked</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Download size={16} />
                CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 bg-[#004d4a] hover:bg-[#003d3a] text-white rounded-md"
              >
                <Download size={16} />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Execution History ({filteredReceipts.length})
              </h2>
              <div className="text-sm text-gray-500">
                Showing {Math.min(10, filteredReceipts.length)} of {filteredReceipts.length} results
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.slice(0, 10).map((receipt, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(receipt.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{receipt.subscription}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.condition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        receipt.executed 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {receipt.executed ? '✅ Success' : '❌ Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.amount ? `$${receipt.amount}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {receipt.txHash ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-600 font-mono">
                            {receipt.txHash.slice(0, 6)}...{receipt.txHash.slice(-4)}
                          </code>
                          <button
                            onClick={() => handleCopyTxHash(receipt.txHash!)}
                            className="text-[#004d4a] hover:text-[#003d3a]"
                          >
                            {copiedHash === receipt.txHash ? 'Copied!' : <Copy size={14} />}
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onViewReceipt(receipt)}
                        className="text-[#004d4a] hover:text-[#003d3a] flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReceipts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No receipts found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Audit Summary */}
        {filteredReceipts.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Summary</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((stats.successful / stats.total) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ${stats.totalAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Executed Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.blocked}
                </div>
                <div className="text-sm text-gray-600">Blocked Executions</div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Audit Trail:</strong> All execution records are cryptographically signed and stored 
                with BITE v2 encryption for complete transparency and accountability.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptAuditTrailPage;