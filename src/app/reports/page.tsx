'use client';
import { BarChart3, TrendingUp, Package, Users, FileText, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/dashboard');
    setStats(await res.json());
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalSales || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <FileText className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Total Invoices</p>
          <p className="text-3xl font-bold mt-2">{stats.totalInvoices || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <Package className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Total Products</p>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <Users className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Total Customers</p>
          <p className="text-3xl font-bold mt-2">{stats.totalCustomers || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Date Range Filter</h3>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border rounded-lg" placeholder="Start Date" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border rounded-lg" placeholder="End Date" />
          <button onClick={fetchStats} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200">
            Apply Filter
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.salesByCategory || []} cx="50%" cy="50%" outerRadius={100}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                dataKey="total_sales">
                {(stats.salesByCategory || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Top Selling Products</h3>
        <div className="space-y-4">
          {(stats.topProducts || []).map((product: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">{product.product_name}</p>
                  <p className="text-sm text-gray-600">{product.total_quantity} units sold</p>
                </div>
              </div>
              <p className="font-bold text-green-600 text-lg">{formatCurrency(product.total_sales)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Quick Export Options</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center backdrop-blur-sm">
            <Download className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Export Sales Report</p>
          </button>
          <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center backdrop-blur-sm">
            <Download className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Export Inventory Report</p>
          </button>
          <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center backdrop-blur-sm">
            <Download className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Export Customer Report</p>
          </button>
        </div>
      </div>
    </div>
  );
}
