import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'billing.db');
const db = new Database(dbPath);

// Initialize database tables with Indian market features
db.exec(`
  CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    gstin TEXT,
    pan TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    mrp REAL,
    cost_price REAL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    hsn_code TEXT,
    category_id INTEGER,
    gst_rate REAL DEFAULT 0,
    unit TEXT DEFAULT 'PCS',
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    gstin TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    customer_type TEXT DEFAULT 'regular',
    credit_limit REAL DEFAULT 0,
    outstanding_balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER DEFAULT 0,
    customer_name TEXT,
    customer_phone TEXT,
    customer_gstin TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    discount_percent REAL DEFAULT 0,
    cgst_amount REAL DEFAULT 0,
    sgst_amount REAL DEFAULT 0,
    igst_amount REAL DEFAULT 0,
    total_gst REAL DEFAULT 0,
    round_off REAL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    hsn_code TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT DEFAULT 'PCS',
    unit_price REAL NOT NULL,
    discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    taxable_amount REAL NOT NULL,
    gst_rate REAL DEFAULT 0,
    cgst_amount REAL DEFAULT 0,
    sgst_amount REAL DEFAULT 0,
    igst_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    movement_type TEXT NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- Insert default business settings if not exists
  INSERT OR IGNORE INTO business_settings (id, business_name, address, city, state, phone)
  VALUES (1, 'My Store', 'Shop Address', 'City', 'State', '1234567890');

  -- Insert default categories
  INSERT OR IGNORE INTO categories (name, description) VALUES 
  ('Electronics', 'Electronic items and accessories'),
  ('Groceries', 'Food and grocery items'),
  ('Clothing', 'Apparel and fashion'),
  ('Accessories', 'Various accessories'),
  ('Others', 'Miscellaneous items');

  -- Insert sample products if none exist
  INSERT OR IGNORE INTO products (id, name, description, price, mrp, cost_price, quantity, min_stock_level, sku, hsn_code, category_id, gst_rate, unit, is_active)
  VALUES 
  (1, 'LED Bulb 9W', 'Energy efficient LED bulb', 120, 150, 80, 100, 10, 'LED-001', '8539', 1, 18, 'PCS', 1),
  (2, 'Sugar 1kg', 'Pure cane sugar', 45, 50, 35, 200, 20, 'SUG-001', '1701', 2, 5, 'KG', 1),
  (3, 'Rice 5kg', 'Basmati rice', 350, 420, 280, 50, 10, 'RIC-001', '1006', 2, 5, 'KG', 1),
  (4, 'Cotton Shirt', 'Men formal shirt', 599, 899, 350, 30, 5, 'SHT-001', '6205', 3, 12, 'PCS', 1),
  (5, 'Mobile Cover', 'Smartphone protective cover', 199, 299, 100, 75, 15, 'MOB-001', '8518', 1, 18, 'PCS', 1);

  -- Insert sample customers if none exist
  INSERT OR IGNORE INTO customers (id, name, email, phone, address, city, state, customer_type, is_active)
  VALUES 
  (1, 'Rajesh Kumar', 'rajesh@example.com', '9876543210', '123 Main Street', 'Mumbai', 'Maharashtra', 'regular', 1),
  (2, 'Priya Sharma', 'priya@example.com', '9876543211', '456 Oak Avenue', 'Delhi', 'Delhi', 'regular', 1),
  (3, 'Amit Patel', 'amit@example.com', '9876543212', '789 Pine Road', 'Ahmedabad', 'Gujarat', 'regular', 1);

  -- Insert sample invoices if none exist (for demo purposes)
  INSERT OR IGNORE INTO invoices (id, invoice_number, customer_id, customer_name, customer_phone, subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount, total_gst, round_off, total_amount, payment_method, payment_status, status)
  VALUES 
  (1, 'INV-0001', 1, 'Rajesh Kumar', '9876543210', 1000, 0, 90, 90, 0, 180, 0, 1180, 'cash', 'paid', 'completed'),
  (2, 'INV-0002', 2, 'Priya Sharma', '9876543211', 2000, 100, 85.5, 85.5, 0, 171, 0, 2071, 'card', 'paid', 'completed'),
  (3, 'INV-0003', 3, 'Amit Patel', '9876543212', 500, 0, 45, 45, 0, 90, 0, 590, 'upi', 'paid', 'completed');

  -- Insert sample invoice items if none exist
  INSERT OR IGNORE INTO invoice_items (id, invoice_id, product_id, product_name, hsn_code, quantity, unit, unit_price, discount_percent, discount_amount, taxable_amount, gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount)
  VALUES
  (1, 1, 1, 'LED Bulb 9W', '8539', 5, 'PCS', 120, 0, 0, 600, 18, 54, 54, 0, 708),
  (2, 1, 5, 'Mobile Cover', '8518', 2, 'PCS', 199, 0, 0, 398, 18, 35.82, 35.82, 0, 469.64),
  (3, 2, 3, 'Rice 5kg', '1006', 4, 'KG', 350, 5, 70, 1330, 5, 33.25, 33.25, 0, 1396.5),
  (4, 2, 2, 'Sugar 1kg', '1701', 10, 'KG', 45, 0, 0, 450, 5, 11.25, 11.25, 0, 472.5),
  (5, 3, 4, 'Cotton Shirt', '6205', 1, 'PCS', 599, 0, 0, 599, 12, 35.94, 35.94, 0, 670.88);`);

export default db;
