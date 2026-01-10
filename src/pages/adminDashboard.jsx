import React, { useState, useEffect } from 'react';
import {
  Users, Package, Activity, BarChart3, AlertCircle, CheckCircle, 
  Plus, Edit, Trash2, Eye, Wifi, Lock, Mail, UserPlus, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ReferenceLine, AreaChart, Area 
} from 'recharts';

const AdminDashboard = () => {
  // Mock data - replace with Firebase later
  const [containers, setContainers] = useState([
    { id: 'TS-001', wifiName: 'ThermoSafe-001', wifiPass: '***hidden***', customerEmail: 'pharma@hospital.com', status: 'active', alerts: 0, uptime: '99.8%', lastUpdate: '2min ago' },
    { id: 'TS-002', wifiName: 'ThermoSafe-002', wifiPass: '***hidden***', customerEmail: 'logistics@supply.com', status: 'warning', alerts: 3, uptime: '97.2%', lastUpdate: '5min ago' },
    { id: 'TS-003', wifiName: 'ThermoSafe-003', wifiPass: '***hidden***', customerEmail: 'clinic@healthcare.in', status: 'active', alerts: 0, uptime: '100%', lastUpdate: '1min ago' },
    { id: 'TS-004', wifiName: 'ThermoSafe-004', wifiPass: '***hidden***', customerEmail: 'pharma@distributor.in', status: 'critical', alerts: 12, uptime: '89.4%', lastUpdate: '45min ago' }
  ]);

  const [customers, setCustomers] = useState(4);
  const [totalContainers, setTotalContainers] = useState(4);
  const [activeContainers, setActiveContainers] = useState(3);
  const [alertsToday, setAlertsToday] = useState(15);

  const [newContainer, setNewContainer] = useState({ id: '', wifiName: '', wifiPass: '', customerEmail: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);

  // Mock analytics for demo (replace with Firebase per container)
  const containerAnalytics = [
    { time: '00:00', internal: 4.2, external: 28.5 },
    { time: '01:00', internal: 4.5, external: 29.1 },
    { time: '02:00', internal: 5.1, external: 30.2 },
    { time: '03:00', internal: 5.8, external: 31.4 },
    { time: '04:00', internal: 6.3, external: 32.1 },
    { time: '05:00', internal: 7.2, external: 31.8 },
    { time: '06:00', internal: 7.9, external: 30.5 },
    { time: '07:00', internal: 8.1, external: 29.2 }
  ];

  const statsData = [
    { name: 'Total Containers', value: totalContainers, change: '+2', icon: Package, color: 'green' },
    { name: 'Active', value: activeContainers, change: '-1', icon: CheckCircle, color: 'green' },
    { name: 'Customers', value: customers, change: '+1', icon: Users, color: 'blue' },
    { name: 'Alerts Today', value: alertsToday, change: '+5', icon: AlertCircle, color: 'red' }
  ];

  const addContainer = () => {
    setContainers([...containers, { ...newContainer, status: 'active', alerts: 0, uptime: '100%', lastUpdate: 'Now' }]);
    setTotalContainers(totalContainers + 1);
    setActiveContainers(activeContainers + 1);
    setNewContainer({ id: '', wifiName: '', wifiPass: '', customerEmail: '' });
    setShowAddModal(false);
  };

  const deleteContainer = (id) => {
    setContainers(containers.filter(c => c.id !== id));
    setTotalContainers(totalContainers - 1);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ThermoSafe Admin
              </h1>
              <p className="text-gray-600 mt-1">Cold Chain Container Management</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Container
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color === 'green' ? 'from-green-50 to-emerald-50' : stat.color === 'blue' ? 'from-blue-50 to-indigo-50' : 'from-red-50 to-rose-50'}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from yesterday
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Containers Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Active Containers</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Container ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Uptime</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alerts</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {containers.map((container, idx) => (
                    <tr key={container.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{container.id}</div>
                            <div className="text-xs text-gray-500">{container.wifiName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{container.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(container.status)}`}>
                          {container.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{container.uptime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${container.alerts > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {container.alerts}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1 -m-1 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1 -m-1 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteContainer(container.id)}
                          className="text-red-600 hover:text-red-900 p-1 -m-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Performance Overview
                </h3>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 24h</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={containers.map(c => ({ name: c.id, uptime: parseFloat(c.uptime), alerts: c.alerts }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="uptime" fill="#3B82F6" name="Uptime %" />
                  <Bar dataKey="alerts" fill="#EF4444" name="Alerts" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Temperature Differential</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={containerAnalytics}>
                  <defs>
                    <linearGradient id="internal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <ReferenceLine y={2} stroke="#EF4444" strokeDasharray="3 3" label="Min Safe" />
                  <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="3 3" label="Max Safe" />
                  <Area type="monotone" dataKey="internal" stroke="#10B981" fillOpacity={1} fill="url(#internal)" name="Internal" />
                  <Line type="monotone" dataKey="external" stroke="#F59E0B" strokeWidth={3} name="External" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Add Container Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Container</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Container ID</label>
                <input
                  type="text"
                  value={newContainer.id}
                  onChange={(e) => setNewContainer({...newContainer, id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="TS-005"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">WiFi Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newContainer.wifiName}
                    onChange={(e) => setNewContainer({...newContainer, wifiName: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ThermoSafe-005"
                  />
                  <Wifi className="w-5 h-5 text-gray-400 mt-3" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">WiFi Password</label>
                <input
                  type="password"
                  value={newContainer.wifiPass}
                  onChange={(e) => setNewContainer({...newContainer, wifiPass: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter WiFi password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newContainer.customerEmail}
                    onChange={(e) => setNewContainer({...newContainer, customerEmail: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@company.com"
                  />
                  <Mail className="w-5 h-5 text-gray-400 mt-3" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={addContainer}
                  disabled={!newContainer.id || !newContainer.wifiName || !newContainer.wifiPass || !newContainer.customerEmail}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  Create Container
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
