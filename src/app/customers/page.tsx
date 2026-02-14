'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, CreditCard, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', gstin: '', address: '', city: '', state: '', pincode: '',
    customer_type: 'regular', credit_limit: 0,
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    setCustomers(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    fetchCustomers();
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-indigo-600" />
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">Manage customer information and relationships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:shadow-lg flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    customer.customer_type === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.customer_type || 'Regular'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {customer.phone}
                </div>
              )}
              {customer.address && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-1" />
                  <span>{customer.address}{customer.city && `, ${customer.city}`}{customer.state && `, ${customer.state}`}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="text-xs text-gray-500 mt-2">
                  <strong>GSTIN:</strong> {customer.gstin}
                </div>
              )}
              {customer.outstanding_balance > 0 && (
                <div className="flex items-center text-sm text-red-600 mt-3 pt-3 border-t">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Outstanding: {formatCurrency(customer.outstanding_balance)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-2xl font-bold">Add New Customer</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">Customer Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">GSTIN</label>
                  <input type="text" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Address</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Pincode</label>
                  <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Customer Type</label>
                  <select value={formData.customer_type} onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg">
                    <option value="regular">Regular</option>
                    <option value="premium">Premium</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg">
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
