import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createStoreOrder } from '@/lib/data-store';
import { priceCart } from '@/lib/order-pricing';
import { computeTotals } from '@/lib/pricing';

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_data } = body;

    // Validate presence of required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields: order_id, payment_id, or signature.' },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json(
        { error: 'Razorpay secret key not configured on server.' },
        { status: 500 }
      );
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expected_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected_signature, 'utf-8');
    const clientBuffer = Buffer.from(razorpay_signature, 'utf-8');

    const isMatch =
      expectedBuffer.length === clientBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, clientBuffer);

    if (!isMatch) {
      console.warn('Signature mismatch for Razorpay order:', razorpay_order_id);
      return NextResponse.json(
        { success: false, error: 'Signature mismatch: payment cannot be verified.' },
        { status: 400 }
      );
    }

    // Payment is authentic & verified! Create / update the order
    let savedOrder = null;
    if (order_data) {
      // Record what Razorpay actually charged, not the total the browser sent.
      let chargedTotal = order_data.total_amount;
      try {
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret });
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (rzpOrder?.amount) chargedTotal = rzpOrder.amount / 100;
      } catch (fetchErr) {
        console.warn('Could not fetch Razorpay order amount; keeping submitted total:', fetchErr?.message);
      }
      // Order lines are rebuilt from the product store; the payment is already
      // verified, so a pricing problem must not lose the order record.
      let items = order_data.items;
      let subtotal = order_data.subtotal;
      try {
        const priced = await priceCart(order_data.items);
        items = priced.lines;
        subtotal = priced.subtotal;
      } catch (priceErr) {
        console.warn('Could not reprice paid order items; keeping submitted lines:', priceErr?.message);
      }
      const totals = computeTotals(subtotal, { prepaid: true });
      try {
        savedOrder = await createStoreOrder({
          customer_name: order_data.customer_name,
          customer_email: order_data.customer_email,
          customer_phone: order_data.customer_phone,
          shipping_address: order_data.shipping_address,
          city: order_data.city,
          state: order_data.state,
          pincode: order_data.pincode,
          items,
          subtotal: totals.subtotal,
          shipping: totals.delivery,
          discount: totals.discount,
          total_amount: chargedTotal,
          payment_method: 'RAZORPAY',
          payment_status: 'PAID',
          razorpay_order_id,
          razorpay_payment_id,
        });
      } catch (saveErr) {
        // The customer has paid: report success and log loudly so the order can be recovered.
        console.error('PAID ORDER NOT SAVED', razorpay_order_id, razorpay_payment_id, saveErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully.',
      razorpay_order_id,
      razorpay_payment_id,
      order: savedOrder,
    });
  } catch (err) {
    console.error('Error during signature verification:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed on server.' },
      { status: 500 }
    );
  }
}
