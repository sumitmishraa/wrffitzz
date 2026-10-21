import { NextResponse } from 'next/server';
import { getStoreOrders, createStoreOrder, updateStoreOrder } from '@/lib/data-store';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { priceCart } from '@/lib/order-pricing';
import { computeTotals } from '@/lib/pricing';
import { isBangalorePincode, cleanPincode } from '@/lib/delivery';

function fail(err) {
  const status = err?.status || 500;
  if (status >= 500) console.error('Orders API error:', err);
  return NextResponse.json({ error: err?.message || 'Something went wrong.' }, { status });
}

const unauthorized = () =>
  NextResponse.json({ error: 'Sign in to the admin to see orders.' }, { status: 401 });

const text = (v, max) => String(v ?? '').trim().slice(0, max);

// Admin: every order, newest first
export async function GET(request) {
  if (!isAuthorizedAdmin(request)) return unauthorized();
  try {
    return NextResponse.json(await getStoreOrders());
  } catch (err) {
    return fail(err);
  }
}

// Public: place a cash-on-delivery order. Prices and totals are worked out here.
export async function POST(request) {
  try {
    const body = await request.json();
    const customer = {
      customer_name: text(body.customer_name, 120),
      customer_email: text(body.customer_email, 160),
      customer_phone: text(body.customer_phone, 20).replace(/\D/g, '').slice(-10),
      shipping_address: text(body.shipping_address, 400),
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: cleanPincode(body.pincode),
    };
    if (!customer.customer_name || !customer.shipping_address || customer.customer_phone.length !== 10) {
      return NextResponse.json({ error: 'Name, address and a 10-digit mobile number are required.' }, { status: 400 });
    }
    if (!isBangalorePincode(customer.pincode)) {
      return NextResponse.json({ error: 'We deliver inside Bangalore only for now.' }, { status: 400 });
    }

    const { lines, subtotal } = await priceCart(body.items);
    const totals = computeTotals(subtotal, { prepaid: false });
    const order = await createStoreOrder({
      ...customer,
      items: lines,
      subtotal: totals.subtotal,
      shipping: totals.delivery,
      discount: 0,
      total_amount: totals.total,
      payment_method: 'COD',
      payment_status: 'PENDING_COD',
      estimated_delivery: text(body.estimated_delivery, 80),
    });
    return NextResponse.json(order);
  } catch (err) {
    return fail(err);
  }
}

// Admin: update status, tracking, courier, payment status or notes
export async function PATCH(request) {
  if (!isAuthorizedAdmin(request)) return unauthorized();
  try {
    const { id, note, ...changes } = await request.json();
    if (!id) return NextResponse.json({ error: 'Order id is required.' }, { status: 400 });
    const order = await updateStoreOrder(id, changes, note);
    return NextResponse.json({ success: true, order });
  } catch (err) {
    return fail(err);
  }
}
