import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
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
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    if (lineItems.data.length === 0) {
      return NextResponse.json({ error: 'No line items' }, { status: 400 });
    }

    const cartItems: { productId: string; variantId: string | null; quantity: number }[] = session.metadata?.cartItems
      ? JSON.parse(session.metadata.cartItems)
      : [{
          productId: session.metadata?.productId || '',
          variantId: session.metadata?.variantId || null,
          quantity: parseInt(session.metadata?.quantity || '1'),
        }];

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

    for (let i = 0; i < lineItems.data.length; i++) {
      const lineItem = lineItems.data[i];
      const cartItem = cartItems[i] || cartItems[0];
      const { productId, variantId, quantity } = cartItem;

      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();

      let variantName = null;
      if (variantId) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('name')
          .eq('id', variantId)
          .single();
        variantName = variant?.name || null;
      }

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: productId,
        variant_id: variantId || null,
        product_name: product?.name || 'Unknown Product',
        variant_name: variantName,
        quantity,
        price_cents: lineItem.price?.unit_amount || 0,
      });

      if (variantId) {
        await supabase.rpc('decrement_inventory', {
          variant_id: variantId,
          quantity,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
