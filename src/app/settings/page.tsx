'use client';
import { useState, useEffect } from 'react';
import { Settings, Building, Save, Upload } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    business_name: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    logo_url: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.business_name) {
      // Convert null values to empty strings for controlled inputs
      setSettings({
        business_name: data.business_name || '',
        gstin: data.gstin || '',
        pan: data.pan || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        phone: data.phone || '',
        email: data.email || '',
        logo_url: data.logo_url || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="w-8 h-8 mr-3 text-indigo-600" />
          Business Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure your business information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold">Business Information</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-2">Business Name *</label>
            <input type="text" value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">GSTIN</label>
            <input type="text" value={settings.gstin}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="22AAAAA0000A1Z5" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">PAN</label>
            <input type="text" value={settings.pan}
              onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="AAAAA0000A" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Phone</label>
            <input type="tel" value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input type="email" value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">City</label>
            <input type="text" value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">State</label>
            <input type="text" value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Pincode</label>
            <input type="text" value={settings.pincode}
              onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">Address</label>
            <textarea value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" rows={3} />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit"
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-3 rounded-lg hover:shadow-lg flex items-center space-x-2">
            <Save className="w-5 h-5" />
            <span>Save Settings</span>
          </button>
        </div>

        {saved && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
            ✓ Settings saved successfully!
          </div>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">System Information</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Version</p>
            <p className="text-lg font-bold">1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-lg font-bold">SQLite</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-bold text-green-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
