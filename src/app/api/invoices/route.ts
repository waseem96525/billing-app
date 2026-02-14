import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateGST, generateInvoiceNumber } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    
    let query = `
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (startDate) {
      query += ' AND DATE(i.created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(i.created_at) <= ?';
      params.push(endDate);
    }
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    if (paymentStatus) {
      query += ' AND i.payment_status = ?';
      params.push(paymentStatus);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const invoices = db.prepare(query).all(...params);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_id,
      items,
      discount_percent,
      payment_method,
      payment_status,
      notes,
      is_intra_state = true,
    } = body;
    
    // Get customer details (optional - use walk-in customer if not provided)
    let customer: any = null;
    if (customer_id && customer_id > 0) {
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    }
    
    // Use walk-in customer defaults if no customer selected
    if (!customer) {
      customer = {
        id: 0,
        name: 'Walk-in Customer',
        phone: null,
        gstin: null,
      };
    }
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    
    // Calculate totals
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalGST = 0;
    
    const processedItems = items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscount = itemSubtotal * ((item.discount_percent || 0) / 100);
      const taxableAmount = itemSubtotal - itemDiscount;
      
      subtotal += taxableAmount;
      
      const gst = calculateGST(taxableAmount, item.gst_rate || 0, is_intra_state);
      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
      totalIGST += gst.igst;
      totalGST += gst.total;
      
      return {
        ...item,
        discount_amount: itemDiscount,
        taxable_amount: taxableAmount,
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        igst_amount: gst.igst,
        total_amount: taxableAmount + gst.total,
      };
    });
    
    const discountAmount = subtotal * ((discount_percent || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    
    // Recalculate GST after overall discount
    if (discount_percent && discount_percent > 0) {
      const gstRatio = totalGST / subtotal;
      totalGST = afterDiscount * gstRatio;
      totalCGST = is_intra_state ? (afterDiscount * gstRatio) / 2 : 0;
      totalSGST = is_intra_state ? (afterDiscount * gstRatio) / 2 : 0;
      totalIGST = !is_intra_state ? totalGST : 0;
    }
    
    const total = afterDiscount + totalGST;
    const roundOff = Math.round(total) - total;
    const finalTotal = Math.round(total);
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Insert invoice
      const insertInvoice = db.prepare(`
        INSERT INTO invoices (
          invoice_number, customer_id, customer_name, customer_phone, customer_gstin,
          subtotal, discount_amount, discount_percent,
          cgst_amount, sgst_amount, igst_amount, total_gst,
          round_off, total_amount, payment_method, payment_status, status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
      `);
      
      const invoiceResult = insertInvoice.run(
        invoiceNumber,
        customer_id || 0,
        customer.name,
        customer.phone || null,
        customer.gstin || null,
        subtotal,
        discountAmount,
        discount_percent || 0,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST,
        roundOff,
        finalTotal,
        payment_method || 'cash',
        payment_status || 'paid',
        notes || null
      );
      
      const invoiceId = invoiceResult.lastInsertRowid;
      
      // Insert invoice items
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_id, product_name, hsn_code, quantity, unit,
          unit_price, discount_percent, discount_amount, taxable_amount,
          gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const updateStock = db.prepare(`
        UPDATE products SET quantity = quantity - ? WHERE id = ?
      `);
      
      const insertStockMovement = db.prepare(`
        INSERT INTO stock_movements (product_id, quantity, movement_type, reference_type, reference_id, notes)
        VALUES (?, ?, 'sale', 'invoice', ?, ?)
      `);
      
      for (const item of processedItems) {
        insertItem.run(
          invoiceId,
          item.product_id,
          item.product_name,
          item.hsn_code || null,
          item.quantity,
          item.unit || 'PCS',
          item.unit_price,
          item.discount_percent || 0,
          item.discount_amount,
          item.taxable_amount,
          item.gst_rate || 0,
          item.cgst_amount,
          item.sgst_amount,
          item.igst_amount,
          item.total_amount
        );
        
        // Update product stock
        updateStock.run(item.quantity, item.product_id);
        
        // Record stock movement
        insertStockMovement.run(
          item.product_id,
          -item.quantity,
          invoiceId,
          `Sale via invoice ${invoiceNumber}`
        );
      }
      
      // If payment is received, record it
      if (payment_status === 'paid') {
        db.prepare(`
          INSERT INTO payments (invoice_id, amount, payment_method, transaction_id)
          VALUES (?, ?, ?, ?)
        `).run(invoiceId, finalTotal, payment_method || 'cash', null);
      }
      
      return invoiceId;
    });
    
    const invoiceId = transaction();
    
    return NextResponse.json({
      id: invoiceId,
      invoice_number: invoiceNumber,
      total_amount: finalTotal,
      message: 'Invoice created successfully',
    });
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
