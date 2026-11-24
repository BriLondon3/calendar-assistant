'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '../auth-client';
import { adminDb, billingConfigured, getBilling, isSubscribed, stripe, TRIAL_DAYS } from '../billing';

async function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const list = await headers();
  return `${list.get('x-forwarded-proto') || 'https'}://${list.get('host')}`;
}

// Finds or creates the Stripe customer for this user and remembers it.
async function customerFor(user, row) {
  if (row.stripe_customer_id) return row.stripe_customer_id;
  const customer = await stripe().customers.create({
    email: user.email,
    name: user.user_metadata?.full_name || undefined,
    metadata: { user_id: user.id },
  });
  const { error } = await adminDb().from('billing').upsert({ user_id: user.id, stripe_customer_id: customer.id }, { onConflict: 'user_id' });
  if (error) throw new Error('Billing storage unavailable');
  return customer.id;
}

// Sends the user to Stripe Checkout for the $2.99/month plan (with a free trial the first time).
export async function startCheckout(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  if (!billingConfigured()) redirect('/account?billing=unavailable');
  const from = formData?.get('from') === 'upload' ? '/upload' : '/account';
  let url;
  try {
    const row = await getBilling(user.id);
    if (isSubscribed(row)) redirect('/account?billing=already');
    const customer = await customerFor(user, row);
    const site = await siteUrl();
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id },
        ...(!row.had_trial && { trial_period_days: TRIAL_DAYS }),
      },
      allow_promotion_codes: true,
      success_url: `${site}${from}?billing=success`,
      cancel_url: `${site}${from}?billing=cancelled`,
    });
    url = session.url;
  } catch (error) {
    unstable_rethrow(error);
    console.error('Stripe checkout failed', { message: error?.message });
    redirect(`${from}?billing=error`);
  }
  redirect(url);
}

// Opens Stripe's billing portal: update card, see invoices, cancel.
export async function openBillingPortal() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?mode=login');
  if (!billingConfigured()) redirect('/account?billing=unavailable');
  let url;
  try {
    const row = await getBilling(user.id);
    if (!row.stripe_customer_id) redirect('/account');
    const portal = await stripe().billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${await siteUrl()}/account`,
    });
    url = portal.url;
  } catch (error) {
    unstable_rethrow(error);
    console.error('Stripe portal failed', { message: error?.message });
    redirect('/account?billing=error');
  }
  redirect(url);
}
