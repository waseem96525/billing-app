import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const low_stock = searchParams.get('low_stock');
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params: any[] = [];
    
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    
    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (low_stock === 'true') {
      query += ' AND p.quantity < p.min_stock_level';
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const products = db.prepare(query).all(...params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      mrp,
      cost_price,
      quantity,
      min_stock_level,
      sku,
      barcode,
      hsn_code,
      category_id,
      gst_rate,
      unit,
      image_url,
    } = body;
    
    const stmt = db.prepare(`
      INSERT INTO products (
        name, description, price, mrp, cost_price, quantity, min_stock_level,
        sku, barcode, hsn_code, category_id, gst_rate, unit, image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      description || null,
      price,
      mrp || price,
      cost_price || null,
      quantity || 0,
      min_stock_level || 10,
      sku || null,
      barcode || null,
      hsn_code || null,
      category_id || null,
      gst_rate || 0,
      unit || 'PCS',
      image_url || null
    );
    
    // Record stock movement
    if (quantity > 0) {
      db.prepare(`
        INSERT INTO stock_movements (product_id, quantity, movement_type, notes)
        VALUES (?, ?, 'initial', 'Initial stock')
      `).run(result.lastInsertRowid, quantity);
    }
    
    return NextResponse.json({
      id: result.lastInsertRowid,
      message: 'Product created successfully',
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
