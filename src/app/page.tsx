'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  Users,
  FileText,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
  totalSales: number;
  todaySales: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalInvoices: number;
  pendingPayments: number;
  recentInvoices: any[];
  topProducts: any[];
  salesByCategory: any[];
  salesTrend: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    recentInvoices: [],
    topProducts: [],
    salesByCategory: [],
    salesTrend: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Link
          href="/invoices"
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 flex items-center space-x-2"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>New Sale</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={<TrendingUp className="w-8 h-8" />}
          gradient="from-blue-500 to-blue-600"
          trend="+12.5%"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalSales)}
          icon={<IndianRupee className="w-8 h-8" />}
          gradient="from-green-500 to-green-600"
          trend="+8.2%"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={<Package className="w-8 h-8" />}
          gradient="from-purple-500 to-purple-600"
          subtitle={`${stats.lowStockProducts} low stock`}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          icon={<Users className="w-8 h-8" />}
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalInvoices}</p>
            </div>
            <FileText className="w-10 h-10 text-indigo-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(stats.pendingPayments)}
              </p>
            </div>
            <CreditCard className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alert</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.lowStockProducts}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
          {stats.lowStockProducts > 0 && (
            <Link
              href="/inventory?filter=low_stock"
              className="text-sm text-orange-600 hover:text-orange-700 mt-2 inline-block"
            >
              View items →
            </Link>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(label) => formatDate(label)}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.salesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total_sales"
              >
                {stats.salesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-600">{product.total_quantity} units sold</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(product.total_sales)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
            <Link href="/invoices" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-600">{invoice.customer_name || 'Walk-in Customer'}</p>
                  <p className="text-xs text-gray-500">{formatDate(invoice.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    invoice.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <QuickAction href="/invoices" label="New Invoice" />
          <QuickAction href="/inventory" label="Add Product" />
          <QuickAction href="/customers" label="Add Customer" />
          <QuickAction href="/reports" label="View Reports" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  gradient,
  trend,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
  subtitle?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className="text-sm mt-2 text-white/90">
              <span className="font-semibold">{trend}</span> from last week
            </p>
          )}
          {subtitle && <p className="text-sm mt-2 text-white/90">{subtitle}</p>}
        </div>
        <div className="text-white/80">{icon}</div>
      </div>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition-all duration-200 hover:scale-105"
    >
      <p className="font-semibold">{label}</p>
    </Link>
  );
}
