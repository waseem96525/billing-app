import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'database.sqlite');

function ensureDataDir() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (error: any) {
    // If non-EEXIST, log it — but don't crash at import time
    if (error.code !== 'EEXIST') {
      console.error('Error creating data directory:', error);
      // rethrow so caller can handle if desired
      throw error;
    }
  }
}

function runMigrations(database: Database.Database) {
  try {
    database.exec(`
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('Error running migrations:', err);
    throw err;
  }
}

/**
 * getDb - lazily initialize and return the sqlite Database instance.
 * Throws on failure so callers can handle (and route handlers can return JSON).
 */
export function getDb() {
  if (db) return db;

  // Ensure data directory and create DB lazily (at runtime inside handlers)
  ensureDataDir();

  try {
    db = new Database(dbPath);
    // Run schema creation / migrations (wrapped, can throw)
    runMigrations(db);
    return db;
  } catch (error) {
    // Reset db to null on error so subsequent calls can retry if desired
    db = null;
    console.error('Failed to initialize database:', error);
    throw error;
  }
}