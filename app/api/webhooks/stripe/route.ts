import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Get line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    if (lineItems.data.length === 0) {
      return NextResponse.json({ error: 'No line items' }, { status: 400 });
    }

    const lineItem = lineItems.data[0];
    const { productId, variantId, quantity } = session.metadata || {};

    if (!productId) {
      return NextResponse.json({ error: 'No product ID' }, { status: 400 });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        customer_email: session.customer_email || session.customer_details?.email || '',
        customer_name: session.customer_details?.name || null,
        total_cents: session.amount_total || 0,
        status: 'paid',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    // Get variant details if exists
    let variantName = null;
    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('name')
        .eq('id', variantId)
        .single();
      variantName = variant?.name || null;
    }

    // Create order item
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: productId,
      variant_id: variantId || null,
      product_name: product?.name || 'Unknown Product',
      variant_name: variantName,
      quantity: parseInt(quantity || '1'),
      price_cents: lineItem.price?.unit_amount || 0,
    });

    // Decrement inventory if variant exists
    if (variantId) {
      const { error: invError } = await supabase.rpc('decrement_inventory', {
        variant_id: variantId,
        quantity: parseInt(quantity || '1'),
      });
      if (invError) {
        console.error('Inventory decrement error:', invError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
