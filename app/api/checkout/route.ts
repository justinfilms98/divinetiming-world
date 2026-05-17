import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getStripeSecretKey, ENV_ERROR_MESSAGES } from '@/lib/env';
import { apiSuccess, apiError } from '@/lib/apiResponses';

type CartItem = { productId: string; variantId: string | null; quantity: number };

async function getOrCreateStripePrice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stripe: Stripe,
  product: any,
  variant: any,
  productId: string,
  variantId: string | null
) {
  const priceCents = variant?.price_cents ?? product.price_cents;
  let stripePriceId = variant?.stripe_price_id;

  let stripeProductId = product.stripe_product_id;
  if (!stripeProductId) {
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description || undefined,
      images: product.product_images?.map((img: any) => img.image_url) || [],
    });
    stripeProductId = stripeProduct.id;
    await supabase.from('products').update({ stripe_product_id: stripeProductId }).eq('id', productId);
  }

  if (!stripePriceId) {
    const stripePrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: priceCents,
      currency: 'usd',
    });
    stripePriceId = stripePrice.id;
    if (variant) {
      await supabase
        .from('product_variants')
        .update({ stripe_price_id: stripePriceId })
        .eq('id', variantId);
    }
  }

  return stripePriceId;
}

export async function POST(request: NextRequest) {
  const stripeKey = getStripeSecretKey();
  if (!stripeKey) {
    return apiError(ENV_ERROR_MESSAGES.checkoutUnavailable, 503);
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-10-29.clover' });
  try {
    const body = await request.json();
    const items: CartItem[] = body.items
      ? body.items
      : [{ productId: body.productId, variantId: body.variantId || null, quantity: body.quantity || 1 }];

    if (items.length === 0) {
      return apiError('No items', 400);
    }

    const supabase = await createClient();
    const lineItems: { price: string; quantity: number }[] = [];
    let cancelSlug = 'shop';

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*)')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return apiError('Product not found', 404);
      }

      cancelSlug = product.slug;
      const variant = item.variantId
        ? product.product_variants?.find((v: any) => v.id === item.variantId)
        : null;

      const priceId = await getOrCreateStripePrice(
        supabase,
        stripe,
        product,
        variant,
        item.productId,
        item.variantId
      );

      lineItems.push({ price: priceId, quantity: item.quantity });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/shop?success=true`,
      cancel_url: `${request.nextUrl.origin}/shop/${cancelSlug}?canceled=true`,
      metadata: {
        cartItems: JSON.stringify(items),
      },
    });

    return apiSuccess({ url: session.url });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[checkout]', msg);
    }
    return apiError(ENV_ERROR_MESSAGES.checkoutUnavailable, 503);
  }
}
