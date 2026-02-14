import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    
    // Get current quantity for stock movement
    const currentProduct: any = db.prepare('SELECT quantity FROM products WHERE id = ?').get(id);
    
    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, mrp = ?, cost_price = ?,
          quantity = ?, min_stock_level = ?, sku = ?, barcode = ?,
          hsn_code = ?, category_id = ?, gst_rate = ?, unit = ?,
          image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
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
      id
    );
    
    // Record stock movement if quantity changed
    if (currentProduct && currentProduct.quantity !== quantity) {
      const diff = quantity - currentProduct.quantity;
      db.prepare(`
        INSERT INTO stock_movements (product_id, quantity, movement_type, notes)
        VALUES (?, ?, ?, ?)
      `).run(id, diff, diff > 0 ? 'stock_in' : 'stock_out', 'Manual adjustment');
    }
    
    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Soft delete
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
