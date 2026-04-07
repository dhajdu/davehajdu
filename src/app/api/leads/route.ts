import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      console.error('Supabase env vars not configured');
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    // Insert into Supabase (server-side, secret key bypasses RLS)
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          company: company || null,
          message: message || null,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Lead saved successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
