import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ALLOWED_TYPES = ['general', 'keynote', 'consultation'] as const;
type InquiryType = (typeof ALLOWED_TYPES)[number];

// Whitelist of columns we accept from the body. Anything else is dropped.
const ALLOWED_FIELDS = [
  'name',
  'email',
  'phone',
  'company',
  'role',
  'message',
  'event_date',
  'event_location',
  'event_format',
  'audience_size',
  'audience_type',
  'topic_interest',
  'budget_range',
  'company_size',
  'challenge',
  'timeline',
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inquiry_type: InquiryType = ALLOWED_TYPES.includes(body.inquiry_type)
      ? body.inquiry_type
      : 'general';

    // Common required fields across all inquiry types
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Phone is required for keynote and consultation, optional for general
    if ((inquiry_type === 'keynote' || inquiry_type === 'consultation') && !body.phone) {
      return NextResponse.json(
        { error: 'Phone is required for this inquiry type' },
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

    // Build insert payload from whitelist + inquiry_type
    const payload: Record<string, string | null> = { inquiry_type };
    for (const field of ALLOWED_FIELDS) {
      const value = body[field];
      if (value !== undefined && value !== '') {
        payload[field] = value;
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Inquiry saved successfully', data },
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
