import { NextResponse } from 'next/server';
import { getStoreOrders, createStoreOrder, updateStoreOrder } from '@/lib/data-store';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    // Only authorized admin can view customer location, phone, and order dossier
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized: Owner credentials required to access customer orders' }, { status: 401 });
    }

    const orders = getStoreOrders();
    return NextResponse.json(orders);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Public endpoint for customer checkout
    const body = await request.json();
    if (!body.customer_name || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Order must have customer details and items' }, { status: 400 });
    }

    const order = createStoreOrder(body);
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    // Only authorized admin can update order status / waybill
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized: Owner credentials required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updated = updateStoreOrder(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
