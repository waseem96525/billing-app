import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      business_name,
      gstin,
      pan,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      logo_url,
    } = body;
    
    db.prepare(`
      UPDATE business_settings 
      SET business_name = ?, gstin = ?, pan = ?, address = ?, city = ?,
          state = ?, pincode = ?, phone = ?, email = ?, logo_url = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      business_name,
      gstin || null,
      pan || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      phone || null,
      email || null,
      logo_url || null
    );
    
    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}