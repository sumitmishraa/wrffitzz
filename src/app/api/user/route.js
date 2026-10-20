import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

// Helper to sanitize phone numbers (standardize +91 or raw 10 digits)
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.trim();
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const getAll = url.searchParams.get('all') === 'true';

    // If requesting all users for Admin Dashboard
    if (getAll) {
      if (!isAuthorizedAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
      }

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching users from Supabase:', error);
          return NextResponse.json([], { status: 200 });
        }
        return NextResponse.json(data || []);
      }
      return NextResponse.json([]);
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number parameter required' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) {
        console.warn('Supabase get user warning:', error);
      }

      if (data) {
        return NextResponse.json({ success: true, user: data });
      }
    }

    // Default response if not found
    return NextResponse.json({ success: true, user: null });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, name, email } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    if (isSupabaseConfigured() && supabase) {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      const upsertData = {
        phone: cleanPhone,
        name: name || existing?.name || null,
        email: email || existing?.email || null,
        is_admin: existing?.is_admin || false, // Preserve admin flag
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'phone' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user in Supabase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    }

    // Fallback if Supabase not configured
    return NextResponse.json({
      success: true,
      user: {
        phone: cleanPhone,
        name: name || null,
        email: email || null,
        is_admin: false,
      },
    });
  } catch (err) {
    console.error('Error creating/updating user profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    // Only authorized admin can change admin permissions
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, is_admin } = body;

    if (!phone || typeof is_admin !== 'boolean') {
      return NextResponse.json({ error: 'Phone and boolean is_admin flag are required' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(phone);

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({ is_admin, updated_at: new Date().toISOString() })
        .eq('phone', cleanPhone)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    }

    return NextResponse.json({ success: true, message: 'Supabase offline; updated simulated' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
