import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = 'SELECT * FROM customers WHERE is_active = 1';
    const params: any[] = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const customers = db.prepare(query).all(...params);
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      gstin,
      address,
      city,
      state,
      pincode,
      customer_type,
      credit_limit,
    } = body;
    
    const stmt = db.prepare(`
      INSERT INTO customers (
        name, email, phone, gstin, address, city, state, pincode,
        customer_type, credit_limit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      email || null,
      phone || null,
      gstin || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      customer_type || 'regular',
      credit_limit || 0
    );
    
    return NextResponse.json({
      id: result.lastInsertRowid,
      message: 'Customer created successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
