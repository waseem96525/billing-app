'use client';
import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, Barcode, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, mrp: 0, cost_price: 0, quantity: 0,
    min_stock_level: 10, sku: '', barcode: '', hsn_code: '', category_id: 0,
    gst_rate: 18, unit: 'PCS', image_url: '', is_active: 1,
  });

  useEffect(() => { fetchProducts(); fetchCategories(); }, [selectedCategory]);

  const fetchProducts = async () => {
    const url = `/api/products?${selectedCategory ? `category_id=${selectedCategory}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    await fetch(url, {
      method: editingProduct ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    // Convert null values to empty strings for controlled inputs
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      mrp: product.mrp || 0,
      cost_price: product.cost_price || 0,
      quantity: product.quantity || 0,
      min_stock_level: product.min_stock_level || 10,
      sku: product.sku || '',
      barcode: product.barcode || '',
      hsn_code: product.hsn_code || '',
      category_id: product.category_id || 0,
      gst_rate: product.gst_rate || 18,
      unit: product.unit || 'PCS',
      image_url: product.image_url || '',
      is_active: product.is_active ?? 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this product?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStockStatus = (qty: number, min: number) => {
    if (qty === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (qty < min) return { text: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-indigo-600" />
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Manage products, stock levels, and categories</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '', description: '', price: 0, mrp: 0, cost_price: 0, quantity: 0,
              min_stock_level: 10, sku: '', barcode: '', hsn_code: '', category_id: 0,
              gst_rate: 18, unit: 'PCS', image_url: '', is_active: 1,
            });
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:shadow-lg flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => {
          const status = getStockStatus(product.quantity, product.min_stock_level || 10);
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 flex items-center justify-center">
                <Package className="w-16 h-16 text-white/50" />
              </div>
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.text}</span>
                </div>
                {product.category_name && (
                  <div className="flex items-center text-xs text-gray-600 mb-2">
                    <Tag className="w-3 h-3 mr-1" />{product.category_name}
                  </div>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">MRP:</span>
                    <span className="font-semibold">{formatCurrency(product.mrp || product.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-bold text-green-600">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className="font-semibold">{product.quantity} {product.unit}</span>
                  </div>
                  {product.hsn_code && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">HSN:</span>
                      <span>{product.hsn_code}</span>
                    </div>
                  )}
                  {product.gst_rate > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">GST:</span>
                      <span>{product.gst_rate}%</span>
                    </div>
                  )}
                </div>
                {product.sku && (
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Barcode className="w-3 h-3 mr-1" />SKU: {product.sku}
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Product Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="0">Select Category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">HSN Code</label>
                  <input type="text" value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., 8471" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Barcode</label>
                  <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Cost Price (₹)</label>
                  <input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">MRP (₹) *</label>
                  <input type="number" step="0.01" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Selling Price (₹) *</label>
                  <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">GST Rate (%)</label>
                  <select value={formData.gst_rate} onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Quantity *</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Min Stock Level</label>
                  <input type="number" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg">
                    <option value="PCS">Pieces</option>
                    <option value="KG">Kilograms</option>
                    <option value="LTR">Liters</option>
                    <option value="MTR">Meters</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" rows={3} />
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingProduct(null); }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
