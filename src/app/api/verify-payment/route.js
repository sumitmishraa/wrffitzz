import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createStoreOrder } from '@/lib/data-store';

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
      const orderToSave = {
        ...order_data,
        status: 'confirmed',
        payment_method: 'RAZORPAY',
        payment_status: 'PAID',
        razorpay_order_id,
        razorpay_payment_id,
      };
      savedOrder = createStoreOrder(orderToSave);
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
