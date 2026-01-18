import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { productId, variantId, quantity } = await request.json();

    const supabase = await createClient();

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get variant if provided
    let variant = null;
    if (variantId) {
      variant = product.product_variants.find((v: any) => v.id === variantId);
    }

    const priceCents = variant?.price_cents ?? product.price_cents;
    const stripePriceId = variant?.stripe_price_id;

    // Create or get Stripe product
    let stripeProductId = product.stripe_product_id;
    if (!stripeProductId) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        images: product.product_images?.map((img: any) => img.image_url) || [],
      });
      stripeProductId = stripeProduct.id;

      // Update product with Stripe ID
      await supabase
        .from('products')
        .update({ stripe_product_id: stripeProductId })
        .eq('id', productId);
    }

    // Create or get Stripe price
    let finalStripePriceId = stripePriceId;
    if (!finalStripePriceId) {
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: priceCents,
        currency: 'usd',
      });
      finalStripePriceId = stripePrice.id;

      // Update variant with Stripe price ID if variant exists
      if (variant) {
        await supabase
          .from('product_variants')
          .update({ stripe_price_id: finalStripePriceId })
          .eq('id', variantId);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalStripePriceId,
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/shop?success=true`,
      cancel_url: `${request.nextUrl.origin}/shop/${product.slug}?canceled=true`,
      metadata: {
        productId,
        variantId: variantId || '',
        quantity: quantity.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
