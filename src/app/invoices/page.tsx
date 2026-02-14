'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, IndianRupee, Printer, Eye, Search, Grid, Calculator, Pause, User, Scan, Tag, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency, formatDate, generateInvoiceNumber, calculateInvoiceTotals } from '@/lib/utils';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>(0);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [items, setItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [selectedItemForQty, setSelectedItemForQty] = useState<number | null>(null);
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [splitPayments, setSplitPayments] = useState<any[]>([{ method: 'cash', amount: 0 }]);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomerData, setQuickCustomerData] = useState({ name: '', phone: '', email: '' });
  const printRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [inv, prod, cust, cats] = await Promise.all([
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]);
    setInvoices(inv);
    const availableProds = prod.filter((p: any) => p.quantity > 0);
    setProducts(availableProds);
    setAllProducts(availableProds);
    setCustomers(cust);
    setCategories(cats || []);
  };

  // Filter products based on search and category
  useEffect(() => {
    let filtered = allProducts;
    
    if (productSearch) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.barcode && p.barcode.includes(productSearch))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === parseInt(selectedCategory));
    }
    
    setProducts(filtered);
  }, [productSearch, selectedCategory, allProducts]);

  // Handle barcode scan
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    
    if (!barcodeInput) return;
    
    const product = allProducts.find(p => 
      p.barcode === barcodeInput || p.sku === barcodeInput
    );
    
    if (product) {
      addItem(product.id);
      setBarcodeInput('');
    } else {
      alert('Product not found with this barcode/SKU');
      setBarcodeInput('');
    }
  };

  const addItem = (productId: number) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existing = items.find(i => i.product_id === productId);
    const currentQty = existing ? existing.quantity : 0;
    
    // Stock validation
    if (currentQty + 1 > product.quantity) {
      alert(`Only ${product.quantity} units available in stock!`);
      return;
    }
    
    if (existing) {
      setItems(items.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        hsn_code: product.hsn_code,
        quantity: 1,
        unit_price: product.price,
        unit: product.unit,
        gst_rate: product.gst_rate || 0,
        discount_percent: 0,
        available_stock: product.quantity,
      }]);
    }
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setItems(items.filter(i => i.product_id !== productId));
      return;
    }
    
    const item = items.find(i => i.product_id === productId);
    if (item && qty > item.available_stock) {
      alert(`Only ${item.available_stock} units available in stock!`);
      return;
    }
    
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
  };

  const updateItemDiscount = (productId: number, discountPercent: number) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, discount_percent: discountPercent } : i));
  };

  const removeItem = (productId: number) => setItems(items.filter(i => i.product_id !== productId));

  // Numpad functionality
  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setNumpadValue('');
    } else if (value === '←') {
      setNumpadValue(numpadValue.slice(0, -1));
    } else if (value === 'OK' && selectedItemForQty !== null) {
      const qty = parseInt(numpadValue) || 0;
      if (qty > 0) {
        updateQty(selectedItemForQty, qty);
      }
      setNumpadValue('');
      setShowNumpad(false);
      setSelectedItemForQty(null);
    } else if (value !== 'OK') {
      setNumpadValue(numpadValue + value);
    }
  };

  const openNumpad = (productId: number, currentQty: number) => {
    setSelectedItemForQty(productId);
    setNumpadValue(currentQty.toString());
    setShowNumpad(true);
  };

  // Hold bill functionality
  const holdBill = () => {
    if (items.length === 0) {
      alert('No items to hold');
      return;
    }
    
    const bill = {
      id: Date.now(),
      items: [...items],
      customer: selectedCustomer,
      customerName,
      discount,
      paymentMethod,
      notes,
      timestamp: new Date().toISOString(),
    };
    
    setHeldBills([...heldBills, bill]);
    resetForm();
    alert('Bill held successfully!');
  };

  const loadHeldBill = (bill: any) => {
    setItems(bill.items);
    setSelectedCustomer(bill.customer);
    setCustomerName(bill.customerName);
    setDiscount(bill.discount);
    setPaymentMethod(bill.paymentMethod);
    setNotes(bill.notes);
    setHeldBills(heldBills.filter(b => b.id !== bill.id));
    setShowHeldBills(false);
  };

  const deleteHeldBill = (billId: number) => {
    setHeldBills(heldBills.filter(b => b.id !== billId));
  };

  const resetForm = () => {
    setSelectedCustomer(0);
    setCustomerName('Walk-in Customer');
    setItems([]);
    setDiscount(0);
    setNotes('');
    setProductSearch('');
    setBarcodeInput('');
  };

  // Quick add customer
  const handleQuickCustomerAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quickCustomerData),
    });
    const newCustomer = await res.json();
    setCustomers([...customers, newCustomer]);
    setSelectedCustomer(newCustomer.id);
    setCustomerName(newCustomer.name);
    setShowQuickCustomer(false);
    setQuickCustomerData({ name: '', phone: '', email: '' });
  };

  const calculateTotals = () => {
    if (items.length === 0) return { subtotal: 0, totalGST: 0, total: 0, cgst: 0, sgst: 0, igst: 0, discountAmount: 0, roundOff: 0 };
    
    // Calculate with item-level discounts
    const itemsWithDiscount = items.map(item => {
      const baseAmount = item.quantity * item.unit_price;
      const itemDiscount = (baseAmount * item.discount_percent) / 100;
      return {
        ...item,
        itemTotal: baseAmount - itemDiscount,
      };
    });
    
    return calculateInvoiceTotals(itemsWithDiscount, discount, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add items to the invoice');
      return;
    }
    
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: selectedCustomer || 0,
        items,
        discount_percent: discount,
        payment_method: paymentMethod,
        payment_status: 'paid',
        notes,
        is_intra_state: true,
      }),
    });
    
    setShowModal(false);
    resetForm();
    fetchData();
    alert('Invoice created successfully!');
  };

  const viewInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    // Fetch invoice items
    const res = await fetch(`/api/invoices/${invoice.id}`);
    const data = await res.json();
    setInvoiceItems(data.items || []);
    setShowViewModal(true);
  };

  const printInvoice = async (invoice: any) => {
    // Fetch full invoice details with items
    const res = await fetch(`/api/invoices/${invoice.id}`);
    const data = await res.json();
    setSelectedInvoice(data);
    setInvoiceItems(data.items || []);
    
    // Open the modal first
    setShowViewModal(true);
    
    // Wait for the next render cycle to ensure data is displayed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force another render wait
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Now trigger print
    document.body.classList.add('printing');
    window.print();
    
    // Remove class after print dialog closes
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 1000);
  };

  const handlePrintClick = () => {
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 1000);
  };

  const totals = calculateTotals();
  const getStatusColor = (status: string) => {
    const colors: any = { completed: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', cancelled: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-indigo-600" />
            Invoice Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage GST invoices</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:shadow-lg flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Payment</th>
              <th className="px-6 py- text-left text-xs font-bold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-indigo-600">{inv.invoice_number}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold">{inv.customer_name}</div>
                  {inv.customer_phone && <div className="text-xs text-gray-500">{inv.customer_phone}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">{formatCurrency(inv.total_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    inv.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inv.payment_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inv.status)}`}>{inv.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(inv.created_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewInvoice(inv)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => printInvoice(inv)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Print Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold">⚡ POS - Create Invoice</h2>
                <p className="text-sm opacity-90">Fast & efficient billing</p>
              </div>
              <div className="flex items-center space-x-2">
                {heldBills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHeldBills(!showHeldBills)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Held ({heldBills.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={holdBill}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Hold</span>
                </button>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white hover:text-gray-200 text-2xl">&times;</button>
              </div>
            </div>

            {/* Held Bills Panel */}
            {showHeldBills && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Held Bills
                </h3>
                <div className="grid gap-2 md:grid-cols-3">
                  {heldBills.map(bill => (
                    <div key={bill.id} className="bg-white p-3 rounded-lg border shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{bill.customerName}</p>
                          <p className="text-xs text-gray-500">{new Date(bill.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <button
                          onClick={() => deleteHeldBill(bill.id)}
                          className="text-red-600 hover:text-red-800 text-xl"
                          title="Delete"
                        >×</button>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{bill.items.length} items</p>
                      <button
                        onClick={() => loadHeldBill(bill)}
                        className="w-full bg-indigo-600 text-white py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        Load Bill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Panel - Products */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Customer Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Customer
                    </label>
                    <div className="flex gap-2">
                      <select value={selectedCustomer} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedCustomer(val);
                          if (val === 0) {
                            setCustomerName('Walk-in Customer');
                          } else {
                            const cust = customers.find(c => c.id === val);
                            setCustomerName(cust?.name || 'Walk-in Customer');
                          }
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="0">🚶 Walk-in Customer</option>
                        <optgroup label="Registered Customers">
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone && `- ${c.phone}`}</option>)}
                        </optgroup>
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowQuickCustomer(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        title="Quick Add Customer"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Barcode Scanner Input */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold mb-2 flex items-center">
                      <Scan className="w-4 h-4 mr-2" />
                      Scan Barcode / SKU
                    </label>
                    <input
                      ref={barcodeRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeSubmit}
                      placeholder="Scan or enter barcode/SKU and press Enter..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Product Search & Filter */}
                  <div className="bg-white border rounded-lg p-4">
                    <div className="grid gap-3 md:grid-cols-3 mb-3">
                      <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by name, SKU..."
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Product Grid */}
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {products.slice(0, 24).map(p => (
                        <button key={p.id} type="button" onClick={() => addItem(p.id)}
                          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium flex flex-col items-start border border-indigo-200 hover:border-indigo-300 transition-all">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-xs">{formatCurrency(p.price)} • Stock: {p.quantity}</span>
                        </button>
                      ))}
                      {products.length === 0 && (
                        <p className="text-gray-500 text-sm py-4">No products found</p>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  {items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 font-semibold flex items-center">
                        <Grid className="w-4 h-4 mr-2" />
                        Cart Items ({items.length})
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Product</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold">Price</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold">Qty</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold">Disc%</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold">Total</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map(item => {
                              const baseAmount = item.quantity * item.unit_price;
                              const itemDiscount = (baseAmount * item.discount_percent) / 100;
                              const afterDiscount = baseAmount - itemDiscount;
                              const gstAmt = (afterDiscount * item.gst_rate) / 100;
                              const itemTotal = afterDiscount + gstAmt;
                              
                              return (
                                <tr key={item.product_id} className="border-t hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm">
                                    <div className="font-medium">{item.product_name}</div>
                                    <div className="text-xs text-gray-500">Stock: {item.available_stock} • GST: {item.gst_rate}%</div>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center">{formatCurrency(item.unit_price)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => openNumpad(item.product_id, item.quantity)}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-semibold hover:bg-blue-200"
                                      title="Click for numpad"
                                    >
                                      {item.quantity}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={item.discount_percent}
                                      onChange={(e) => updateItemDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                                      className="w-14 px-2 py-1 border rounded text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right font-semibold text-green-600">
                                    {formatCurrency(itemTotal)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button type="button" onClick={() => removeItem(item.product_id)}
                                      className="text-red-600 hover:text-red-800 font-bold text-xl">×</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Additional Options */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold mb-2">💰 Overall Discount (%)</label>
                      <input type="number" min="0" max="100" step="0.01" value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">💳 Payment Method</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="cash">💵 Cash</option>
                        <option value="card">💳 Card</option>
                        <option value="upi">📱 UPI</option>
                        <option value="netbanking">🏦 Net Banking</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">📝 Notes</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" rows={2}
                      placeholder="Add any notes or special instructions..." />
                  </div>
                </div>

                {/* Right Panel - Summary */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-xl border-2 border-indigo-200 sticky top-24">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
                      Invoice Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-semibold">{items.length} items ({items.reduce((sum, i) => sum + i.quantity, 0)} units)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                      </div>
                      {totals.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount ({discount}%):</span>
                          <span className="font-semibold">-{formatCurrency(totals.discountAmount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">CGST:</span>
                          <span>{formatCurrency(totals.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">SGST:</span>
                          <span>{formatCurrency(totals.sgst)}</span>
                        </div>
                        <div className="flex justify-between font-semibold mt-1">
                          <span className="text-gray-600">Total GST:</span>
                          <span className="text-blue-600">{formatCurrency(totals.totalGST)}</span>
                        </div>
                      </div>
                      {totals.roundOff !== 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Round Off:</span>
                          <span>{formatCurrency(totals.roundOff)}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t-2 border-indigo-300">
                        <div className="flex justify-between text-2xl font-bold text-indigo-600">
                          <span>Total:</span>
                          <span>{formatCurrency(totals.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        type="submit"
                        disabled={items.length === 0}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Complete Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowModal(false); resetForm(); }}
                        className="w-full px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Numpad Modal */}
      {showNumpad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-80">
            <h3 className="text-lg font-bold mb-4 text-center">Enter Quantity</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-right text-3xl font-bold min-h-[60px] flex items-center justify-end">
              {numpadValue || '0'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '←'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNumpadClick(key)}
                  className="bg-gray-200 hover:bg-gray-300 p-4 rounded-lg font-bold text-xl"
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleNumpadClick('OK')}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg font-bold text-xl"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Quick Customer Modal */}
      {showQuickCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Quick Add Customer</h3>
            <form onSubmit={handleQuickCustomerAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Name *</label>
                <input
                  type="text"
                  value={quickCustomerData.name}
                  onChange={(e) => setQuickCustomerData({...quickCustomerData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input
                  type="tel"
                  value={quickCustomerData.phone}
                  onChange={(e) => setQuickCustomerData({...quickCustomerData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={quickCustomerData.email}
                  onChange={(e) => setQuickCustomerData({...quickCustomerData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCustomer(false);
                    setQuickCustomerData({ name: '', phone: '', email: '' });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Invoice Details</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintClick}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button onClick={() => setShowViewModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6" id="invoice-print-area">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-indigo-600">INVOICE</h1>
                <p className="text-gray-600">Invoice #: {selectedInvoice.invoice_number}</p>
                <p className="text-sm text-gray-500">Date: {formatDate(selectedInvoice.created_at)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Bill To:</h3>
                  <p className="text-gray-900">{selectedInvoice.customer_name || 'Walk-in Customer'}</p>
                  {selectedInvoice.customer_phone && <p className="text-gray-600">{selectedInvoice.customer_phone}</p>}
                  {selectedInvoice.customer_gstin && <p className="text-gray-600">GSTIN: {selectedInvoice.customer_gstin}</p>}
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Payment Status: <span className={`font-semibold ${selectedInvoice.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedInvoice.payment_status}</span></p>
                  <p className="text-gray-600">Payment Method: <span className="font-semibold capitalize">{selectedInvoice.payment_method}</span></p>
                </div>
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left text-sm font-semibold">Item</th>
                    <th className="px-3 py-2 text-right text-sm font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right text-sm font-semibold">Price</th>
                    <th className="px-3 py-2 text-right text-sm font-semibold">GST</th>
                    <th className="px-3 py-2 text-right text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.product_name}</p>
                        {item.hsn_code && <p className="text-xs text-gray-500">HSN: {item.hsn_code}</p>}
                      </td>
                      <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-3 py-2 text-right">{item.gst_rate}%</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                  </div>
                )}
                {selectedInvoice.cgst_amount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">CGST:</span>
                    <span>{formatCurrency(selectedInvoice.cgst_amount)}</span>
                  </div>
                )}
                {selectedInvoice.sgst_amount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">SGST:</span>
                    <span>{formatCurrency(selectedInvoice.sgst_amount)}</span>
                  </div>
                )}
                {selectedInvoice.igst_amount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">IGST:</span>
                    <span>{formatCurrency(selectedInvoice.igst_amount)}</span>
                  </div>
                )}
                {selectedInvoice.round_off !== 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Round Off:</span>
                    <span>{formatCurrency(selectedInvoice.round_off)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-indigo-600 pt-2 border-t">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="mt-6 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600"><strong>Notes:</strong> {selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print-only container for invoice */}
      {selectedInvoice && (
        <div id="print-only-invoice" className="hidden print:block">
          <div className="p-8 bg-white" id="invoice-print-area">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold text-indigo-600 mb-2">INVOICE</h1>
                <p className="text-gray-600 font-medium">#{selectedInvoice.invoice_number}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Date: {formatDate(selectedInvoice.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-800">Billing App</h2>
                <p className="text-gray-600 text-sm">123 Business Street</p>
                <p className="text-gray-600 text-sm">City, State, 12345</p>
                <p className="text-gray-600 text-sm">Phone: +91 98765 43210</p>
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="flex justify-between mb-8">
              <div className="w-1/2">
                <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider mb-2">Bill To</h3>
                <div className="text-gray-800">
                  <p className="font-bold text-lg">{selectedInvoice.customer_name || 'Walk-in Customer'}</p>
                  {selectedInvoice.customer_phone && <p>{selectedInvoice.customer_phone}</p>}
                  {selectedInvoice.customer_gstin && <p>GSTIN: {selectedInvoice.customer_gstin}</p>}
                  {selectedInvoice.customer_address && <p className="whitespace-pre-wrap">{selectedInvoice.customer_address}</p>}
                </div>
              </div>
              <div className="w-1/2 text-right">
                <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider mb-2">Payment Details</h3>
                <div className="text-gray-800">
                  <p><span className="text-gray-600">Status:</span> <span className="font-semibold">{selectedInvoice.payment_status}</span></p>
                  <p><span className="text-gray-600">Method:</span> <span className="capitalize">{selectedInvoice.payment_method}</span></p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Item Description</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700">Qty</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-700">Price</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-700">GST</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoiceItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{item.product_name}</p>
                        {item.hsn_code && <p className="text-xs text-gray-500">HSN: {item.hsn_code}</p>}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-800">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-right text-gray-800">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right text-gray-800">{item.gst_rate}%</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                  </div>
                )}
                {selectedInvoice.cgst_amount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>CGST:</span>
                    <span>{formatCurrency(selectedInvoice.cgst_amount)}</span>
                  </div>
                )}
                {selectedInvoice.sgst_amount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>SGST:</span>
                    <span>{formatCurrency(selectedInvoice.sgst_amount)}</span>
                  </div>
                )}
                {selectedInvoice.igst_amount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST:</span>
                    <span>{formatCurrency(selectedInvoice.igst_amount)}</span>
                  </div>
                )}
                {selectedInvoice.round_off !== 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Round Off:</span>
                    <span>{formatCurrency(selectedInvoice.round_off)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-indigo-600 pt-3 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer / Notes */}
            {selectedInvoice.notes && (
              <div className="mt-8 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600"><strong>Notes:</strong> {selectedInvoice.notes}</p>
              </div>
            )}
            
            <div className="mt-12 text-center text-xs text-gray-400">
              <p>Thank you for your business!</p>
              <p>This is a computer generated invoice.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          
          /* Hide all unnecessary content */
          body {
            visibility: hidden;
          }
          
          /* Target our specific print container */
          #print-only-invoice {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            z-index: 99999 !important;
            background: white !important;
            padding: 20px !important; 
          }
          
          #print-only-invoice * {
            visibility: visible !important;
          }
          
          /* Ensure text colors are printed */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
