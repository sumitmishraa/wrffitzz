import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAdminSecret } from '@/lib/admin-auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    // Method 1: Security PIN fallback
    if (pin && pin.trim() === getAdminSecret()) {
      return NextResponse.json({
        authorized: true,
        token: getAdminSecret(),
        method: 'pin',
      });
    }

    // Method 2: Supabase Phone Number Admin Check
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const digits10 = cleanPhone.slice(-10);

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin, phone, name')
          .or(`phone.eq.${phone},phone.eq.+91${digits10},phone.eq.${digits10}`)
          .maybeSingle();

        if (error) {
          console.warn('Supabase admin check notice:', error);
        }

        if (data && data.is_admin === true) {
          return NextResponse.json({
            authorized: true,
            token: getAdminSecret(),
            user: { phone: data.phone, name: data.name },
            method: 'phone',
          });
        }
      }

      return NextResponse.json(
        { authorized: false, error: 'This phone number does not have admin privileges in Supabase.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { authorized: false, error: 'Phone number or admin PIN required.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Admin authentication error:', err);
    return NextResponse.json({ authorized: false, error: err.message }, { status: 500 });
  }
}
