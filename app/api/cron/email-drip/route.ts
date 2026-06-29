import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/client';
import { day3Email } from '@/lib/email/templates/day3';
import { day7Email } from '@/lib/email/templates/day7';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/**
 * GET /api/cron/email-drip
 *
 * Vercel Cron — runs daily at 0 14 * * * (10am ET).
 * Sends day-3 and day-7 onboarding emails to enrolled users who haven't received them yet.
 * Requires Authorization: Bearer <CRON_SECRET> header (Vercel sets this automatically).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[email-drip] CRON_SECRET not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = getResend();
  if (!resend) {
    console.warn('[email-drip] RESEND_API_KEY not set — skipping run');
    return NextResponse.json({ skipped: true, reason: 'Resend not configured' });
  }

  const supabase = createServiceClient();

  const [day3Result, day7Result] = await Promise.allSettled([
    processDayN(supabase, resend, 3),
    processDayN(supabase, resend, 7),
  ]);

  const results = {
    day3: day3Result.status === 'fulfilled' ? day3Result.value : { error: String((day3Result as PromiseRejectedResult).reason) },
    day7: day7Result.status === 'fulfilled' ? day7Result.value : { error: String((day7Result as PromiseRejectedResult).reason) },
  };

  console.log('[email-drip] Run complete', results);
  return NextResponse.json({ ok: true, ...results });
}

type SupabaseClient = ReturnType<typeof createServiceClient>;

async function processDayN(
  supabase: SupabaseClient,
  resend: Resend,
  day: 3 | 7,
): Promise<{ sent: number; skipped: number }> {
  const sentAtCol = day === 3 ? 'day3_sent_at' : 'day7_sent_at';
  const intervalDays = day;

  // Fetch users whose day-N window has passed and email hasn't been sent yet.
  const { data: rows, error } = await supabase
    .from('onboarding_email_sequence')
    .select('user_id, enrolled_at')
    .is(sentAtCol, null)
    .lt('enrolled_at', new Date(Date.now() - intervalDays * 86_400_000).toISOString());

  if (error) {
    console.error(`[email-drip] day${day} query error:`, error);
    throw error;
  }

  if (!rows || rows.length === 0) return { sent: 0, skipped: 0 };

  // Fetch profile data for each user in one query.
  const userIds = rows.map((r) => r.user_id);
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, tier')
    .in('id', userIds);

  if (profileErr) {
    console.error(`[email-drip] day${day} profile fetch error:`, profileErr);
    throw profileErr;
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const profile = profileMap.get(row.user_id);
    if (!profile?.email) {
      skipped++;
      continue;
    }

    const orgName: string = profile.full_name ?? 'your team';
    const tier: string = profile.tier ?? 'free';

    const emailConfig = day === 3
      ? { from: day3Email.from, subject: day3Email.subject, html: day3Email.html(orgName) }
      : { from: day7Email.from, subject: day7Email.subject, html: day7Email.html(orgName, tier) };

    const { error: sendErr } = await resend.emails.send({
      from: emailConfig.from,
      to: profile.email,
      subject: emailConfig.subject,
      html: emailConfig.html,
    });

    if (sendErr) {
      console.error(`[email-drip] day${day} send failed for user=${row.user_id}:`, sendErr);
      skipped++;
      continue;
    }

    // Write sent_at ONLY after confirmed send — ensures retry on next cron if Resend fails.
    const { error: updateErr } = await supabase
      .from('onboarding_email_sequence')
      .update({ [sentAtCol]: new Date().toISOString() })
      .eq('user_id', row.user_id);

    if (updateErr) {
      console.error(`[email-drip] day${day} update failed for user=${row.user_id}:`, updateErr);
      // Email was sent but stamp failed — acceptable; user gets duplicate next cycle.
      // Better than not sending.
    }

    sent++;
    console.log(`[email-drip] day${day} sent to user=${row.user_id}`);
  }

  return { sent, skipped };
}
