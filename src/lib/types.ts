export interface BusinessSettings {
  id?: number;
  business_name: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  cost_price?: number;
  quantity: number;
  min_stock_level?: number;
  sku?: string;
  barcode?: string;
  hsn_code?: string;
  category_id?: number;
  category?: Category;
  gst_rate?: number;
  unit?: string;
  image_url?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  customer_type?: string;
  credit_limit?: number;
  outstanding_balance?: number;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_gstin?: string;
  customer?: Customer;
  subtotal: number;
  discount_amount?: number;
  discount_percent?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_gst?: number;
  round_off?: number;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id?: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  hsn_code?: string;
  product?: Product;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  taxable_amount: number;
  gst_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
}

export interface Payment {
  id?: number;
  invoice_id: number;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface Expense {
  id?: number;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  payment_method?: string;
  created_at?: string;
}

export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalInvoices: number;
  pendingPayments: number;
  recentInvoices: Invoice[];
  topProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_sales: number;
  }>;
  salesByCategory: Array<{
    category: string;
    total_sales: number;
  }>;
}
