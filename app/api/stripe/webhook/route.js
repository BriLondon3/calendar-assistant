import { adminDb, billingConfigured, saveSubscription, stripe } from '../../../billing.js';

export const dynamic = 'force-dynamic';

// Stripe tells us here when a subscription starts, renews, fails or ends.
// Each event is verified with the webhook signing secret before it's trusted.
export async function POST(request) {
  if (!billingConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) return new Response('Billing not configured', { status: 503 });
  const body = await request.text();
  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, request.headers.get('stripe-signature') || '', process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed' && event.data.object.mode === 'subscription') {
      const session = event.data.object;
      const subscription = await stripe().subscriptions.retrieve(session.subscription);
      const userId = session.client_reference_id || subscription.metadata?.user_id;
      if (userId) await saveSubscription(userId, subscription);
    } else if (event.type.startsWith('customer.subscription.')) {
      // Always re-read the subscription so late or out-of-order events can't save stale data.
      const subscription = await stripe().subscriptions.retrieve(event.data.object.id);
      let userId = subscription.metadata?.user_id;
      if (!userId) {
        const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        const { data } = await adminDb().from('billing').select('user_id').eq('stripe_customer_id', customer).maybeSingle();
        userId = data?.user_id;
      }
      if (userId) await saveSubscription(userId, subscription);
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed', { type: event.type, message: error?.message });
    // A 500 makes Stripe retry later.
    return new Response('Webhook handling failed', { status: 500 });
  }
}
