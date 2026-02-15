// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    // initialize DB lazily inside handler so any errors are caught here
    const db = getDb();

    const today = new Date().toISOString().split('T')[0];

    // Total sales (all time)
    const totalSalesResult: any = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE status = 'completed'
    `).get();

    // Today's sales
    const todaySalesResult: any = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE status = 'completed' AND DATE(created_at) = ?
    `).get(today);

    // Product stats
    const productsResult: any = db.prepare(`
      SELECT COUNT(*) as total FROM products WHERE is_active = 1
    `).get();

    const lowStockResult: any = db.prepare(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = 1 AND quantity < min_stock_level
    `).get();

    // Customer count
    const customersResult: any = db.prepare(`
      SELECT COUNT(*) as total FROM customers WHERE is_active = 1
    `).get();

    // Invoice stats
    const invoicesResult: any = db.prepare(`
      SELECT COUNT(*) as total FROM invoices WHERE status = 'completed'
    `).get();

    const pendingPaymentsResult: any = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE payment_status = 'pending'
    `).get();

    // Recent invoices
    const recentInvoices = db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `).all();

    // Top products
    const topProducts = db.prepare(`
      SELECT 
        ii.product_name,
        SUM(ii.quantity) as total_quantity,
        SUM(ii.total_amount) as total_sales
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.status = 'completed'
      GROUP BY ii.product_name
      ORDER BY total_sales DESC
      LIMIT 5
    `).all();

    // Sales by category
    const salesByCategory = db.prepare(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(ii.total_amount) as total_sales
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.status = 'completed'
      GROUP BY c.name
      ORDER BY total_sales DESC
      LIMIT 5
    `).all();

    // Sales trend (last 7 days)
    const salesTrend = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM invoices
      WHERE status = 'completed'
        AND created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    return NextResponse.json({
      totalSales: totalSalesResult.total || 0,
      todaySales: todaySalesResult.total || 0,
      totalProducts: productsResult.total || 0,
      lowStockProducts: lowStockResult.total || 0,
      totalCustomers: customersResult.total || 0,
      totalInvoices: invoicesResult.total || 0,
      pendingPayments: pendingPaymentsResult.total || 0,
      recentInvoices,
      topProducts,
      salesByCategory,
      salesTrend,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    // Return JSON error so client parsing doesn't blow up
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}