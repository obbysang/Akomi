import React, { useState, useEffect } from 'react';
import { RenewalIntent, AgentStatus, ExecutionReceipt } from '../types';
import { Activity, Clock, CheckCircle, XCircle, AlertTriangle, Play, Pause, RefreshCw, Eye } from 'lucide-react';

interface AgentStatusDashboardProps {
  intents: RenewalIntent[];
  receipts: ExecutionReceipt[];
  onViewIntent: (intent: RenewalIntent) => void;
  onToggleAgent: (intentId: string) => void;
  onRefresh: () => void;
}

const AgentStatusDashboard: React.FC<AgentStatusDashboardProps> = ({
  intents,
  receipts,
  onViewIntent,
  onToggleAgent,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'executed' | 'blocked'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case AgentStatus.EXECUTED:
        return 'text-green-600 bg-green-100';
      case AgentStatus.BLOCKED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.PENDING:
        return <Clock size={16} />;
      case AgentStatus.EXECUTED:
        return <CheckCircle size={16} />;
      case AgentStatus.BLOCKED:
        return <XCircle size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const filteredIntents = intents.filter(intent => {
    const matchesFilter = filter === 'all' || intent.status === filter;
    const matchesSearch = intent.subscription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intent.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: intents.length,
    active: intents.filter(i => i.status === AgentStatus.PENDING).length,
    executed: intents.filter(i => i.status === AgentStatus.EXECUTED).length,
    blocked: intents.filter(i => i.status === AgentStatus.BLOCKED).length
  };

  const getRecentExecutions = () => {
    return receipts.slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Status Dashboard</h1>
              <p className="text-gray-600">Monitor and manage your automated renewal agents</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Executed</p>
                <p className="text-2xl font-bold text-green-600">{stats.executed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocked</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agents List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4a]"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'active', 'executed', 'blocked'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        filter === status
                          ? 'bg-[#004d4a] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agents Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Agents ({filteredIntents.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIntents.map((intent) => (
                      <tr key={intent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{intent.subscription}</div>
                          <div className="text-sm text-gray-500 capitalize">{intent.period}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {intent.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(intent.status)}`}>
                            {getStatusIcon(intent.status)}
                            {intent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${intent.maxPrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onViewIntent(intent)}
                              className="text-[#004d4a] hover:text-[#003d3a] flex items-center gap-1"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            {intent.status === AgentStatus.PENDING && (
                              <button
                                onClick={() => onToggleAgent(intent.id)}
                                className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                              >
                                <Pause size={16} />
                                Pause
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredIntents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No agents found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {getRecentExecutions().map((receipt, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-1 ${receipt.executed ? 'text-green-500' : 'text-red-500'}`}>
                        {receipt.executed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {receipt.subscription}
                        </p>
                        <p className="text-sm text-gray-500">
                          {receipt.condition}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(receipt.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {getRecentExecutions().length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No recent executions found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusDashboard;