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

    const email = url.searchParams.get('email');

    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone number or email parameter required' }, { status: 400 });
    }

    const cleanPhone = phone ? normalizePhone(phone) : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('users').select('*');
      if (cleanPhone) {
        query = query.eq('phone', cleanPhone);
      } else if (cleanEmail) {
        query = query.eq('email', cleanEmail);
      }

      const { data, error } = await query.maybeSingle();

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

    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone number or email is required' }, { status: 400 });
    }

    const cleanPhone = phone ? normalizePhone(phone) : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (isSupabaseConfigured() && supabase) {
      // Check if user already exists by phone or email
      let existingQuery = supabase.from('users').select('*');
      if (cleanPhone) {
        existingQuery = existingQuery.eq('phone', cleanPhone);
      } else {
        existingQuery = existingQuery.eq('email', cleanEmail);
      }
      const { data: existing } = await existingQuery.maybeSingle();

      const conflictTarget = cleanEmail ? 'email' : 'phone';
      const upsertData = {
        ...(existing?.id ? { id: existing.id } : {}),
        email: cleanEmail || existing?.email || null,
        phone: cleanPhone || existing?.phone || null,
        name: name || existing?.name || (cleanEmail ? cleanEmail.split('@')[0] : 'wrfitzz Member'),
        is_admin: existing?.is_admin || false, // Preserve admin flag
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: conflictTarget })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user in Supabase:', error);
        // Still return fallback so user session continues seamlessly
        return NextResponse.json({
          success: true,
          user: {
            phone: cleanPhone,
            name: name || existing?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            is_admin: existing?.is_admin || false,
          },
        });
      }

      return NextResponse.json({ success: true, user: data });
    }

    // Fallback if Supabase not configured
    return NextResponse.json({
      success: true,
      user: {
        phone: cleanPhone,
        name: name || (cleanEmail ? cleanEmail.split('@')[0] : 'wrfitzz Member'),
        email: cleanEmail || null,
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
