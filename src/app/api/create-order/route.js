import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { priceCart } from '@/lib/order-pricing';
import { computeTotals } from '@/lib/pricing';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, currency = 'INR', receipt, notes } = body || {};

    // Prices come from the product store, never from the client.
    let subtotal;
    try {
      ({ subtotal } = await priceCart(items));
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: err.status || 400 });
    }
    const totals = computeTotals(subtotal, { prepaid: true });
    const amount = totals.total * 100;

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum amount is 100 paise (₹1.00).' },
        { status: 400 }
      );
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured on server.' },
        { status: 401 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const safeNotes = {};
    if (notes && typeof notes === 'object') {
      for (const [k, v] of Object.entries(notes).slice(0, 10)) safeNotes[k] = String(v).slice(0, 200);
    }

    const options = {
      amount,
      currency,
      receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        ...safeNotes,
        subtotal: String(totals.subtotal),
        delivery: String(totals.delivery),
        prepaid_discount: String(totals.discount),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      totals,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return NextResponse.json(
      { error: err?.error?.description || err.message || 'Failed to create order with Razorpay.' },
      { status: 500 }
    );
  }
}
