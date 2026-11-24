import 'server-only';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Free screenshot extractions before a subscription is needed.
export const FREE_EXTRACTIONS = 3;
export const TRIAL_DAYS = 7;

// Billing turns on only once every key is set in Vercel. Until then the
// site stays free, exactly as before.
export function billingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

let stripeClient;
export function stripe() {
  stripeClient ||= new Stripe(process.env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
  return stripeClient;
}

// Server-only database access that bypasses row-level security. Never send to the browser.
let admin;
export function adminDb() {
  admin ||= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

// Stripe keeps charging/retrying during past_due, so keep access then too.
const ACTIVE = new Set(['active', 'trialing', 'past_due']);

export function isSubscribed(row) {
  return Boolean(row && ACTIVE.has(row.status));
}

export async function getBilling(userId) {
  if (!billingConfigured()) return null;
  const { data, error } = await adminDb().from('billing').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Billing storage unavailable');
  return data || { user_id: userId, free_extractions_used: 0, status: null, had_trial: false };
}

// What the account and upload pages show about the plan.
export async function planSummary(userId) {
  if (!billingConfigured()) return { configured: false };
  const row = await getBilling(userId).catch(() => null);
  if (!row) return { configured: true, unavailable: true };
  return {
    configured: true,
    subscribed: isSubscribed(row),
    status: row.status,
    trialEnd: row.trial_end,
    periodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    hasCustomer: Boolean(row.stripe_customer_id),
    trialAvailable: !row.had_trial,
    freeLeft: Math.max(FREE_EXTRACTIONS - (row.free_extractions_used || 0), 0),
  };
}

// Called before each extraction. Subscribers always pass; others use up a free one.
export async function reserveExtraction(userId) {
  if (!billingConfigured()) return { allowed: true };
  const row = await getBilling(userId);
  if (isSubscribed(row)) return { allowed: true };
  const { data, error } = await adminDb().rpc('use_free_extraction', { p_user: userId, p_limit: FREE_EXTRACTIONS });
  if (error) throw new Error('Billing storage unavailable');
  return data ? { allowed: true, free: true } : { allowed: false };
}

export async function refundExtraction(userId) {
  await adminDb().rpc('refund_free_extraction', { p_user: userId }).then(() => {}, () => {});
}

// Saves a Stripe subscription onto the user's billing row.
export async function saveSubscription(userId, subscription) {
  const periodEnd = Math.max(0, ...(subscription.items?.data || []).map(item => item.current_period_end || 0));
  const toDate = seconds => (seconds ? new Date(seconds * 1000).toISOString() : null);
  const { error } = await adminDb().from('billing').upsert({
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    subscription_id: subscription.id,
    status: subscription.status,
    trial_end: toDate(subscription.trial_end),
    current_period_end: toDate(periodEnd),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
    // Once someone has had a subscription, they don't get another free trial.
    had_trial: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error('Billing storage unavailable');
}

// Right after checkout the webhook may not have arrived yet, so ask Stripe directly.
export async function syncFromStripe(userId) {
  if (!billingConfigured()) return;
  try {
    const row = await getBilling(userId);
    if (!row.stripe_customer_id) return;
    const { data } = await stripe().subscriptions.list({ customer: row.stripe_customer_id, status: 'all', limit: 1 });
    if (data[0]) await saveSubscription(userId, data[0]);
  } catch (error) {
    console.error('Stripe sync failed', { message: error?.message });
  }
}
