import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get invoice
    const invoice: any = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email,
             c.phone as customer_phone, c.address as customer_address,
             c.city as customer_city, c.state as customer_state,
             c.pincode as customer_pincode, c.gstin as customer_gstin
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(id);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Get invoice items
    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `).all(id);
    
    invoice.items = items;
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { payment_status, status, notes } = body;
    
    db.prepare(`
      UPDATE invoices 
      SET payment_status = COALESCE(?, payment_status),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payment_status, status, notes, id);
    
    return NextResponse.json({ message: 'Invoice updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
