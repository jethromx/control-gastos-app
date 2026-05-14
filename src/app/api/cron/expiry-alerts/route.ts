import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Vercel calls this every day at 8am UTC.
// It scans for Briq investments expiring within 30 days and emails each owner.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Query all active Briq investments with term
  const { data: rows, error } = await supabase
    .from('briq_investments')
    .select(`
      id,
      investment_date,
      term_months,
      invested_amount,
      annual_interest_rate,
      investments!inner(id, name, user_id, status)
    `)
    .eq('investments.status', 'active')
    .not('term_months', 'is', null);

  if (error) {
    console.error('Cron expiry-alerts query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const now = new Date();

  // Filter those expiring within 30 days
  type Row = typeof rows[number];
  const expiring = (rows as Row[]).filter((r) => {
    const inv = r.investment_date ? new Date(r.investment_date) : null;
    if (!inv || !r.term_months) return false;
    const expiry = new Date(inv);
    expiry.setMonth(expiry.getMonth() + r.term_months);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  });

  if (!expiring.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by user_id
  const byUser = expiring.reduce<Record<string, Row[]>>((acc, r) => {
    const userId = (r.investments as any).user_id as string;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(r);
    return acc;
  }, {});

  // Fetch user emails via admin API
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = Object.fromEntries(usersData.users.map((u) => [u.id, u.email ?? '']));

  let sent = 0;

  for (const [userId, investments] of Object.entries(byUser)) {
    const email = emailMap[userId];
    if (!email) continue;

    const rows = investments
      .map((r) => {
        const expiry = new Date(r.investment_date!);
        expiry.setMonth(expiry.getMonth() + r.term_months!);
        const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const name = (r.investments as any).name as string;
        const amount = Number(r.invested_amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        const dateStr = expiry.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        const urgency = days <= 7 ? '🔴' : days <= 14 ? '🟠' : '🟡';
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;color:#0f172a">${name}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${amount}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569">${dateStr}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:${days <= 14 ? '#ef4444' : '#f59e0b'}">${urgency} ${days}d</td>
          </tr>`;
      })
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 0">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px">
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">InversionTracker</h1>
      <p style="color:#c7d2fe;font-size:14px;margin:4px 0 0">Alerta de vencimiento</p>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#334155;font-size:15px;margin:0 0 20px">
        Tienes <strong>${investments.length}</strong> inversión${investments.length > 1 ? 'es' : ''} Briq próxima${investments.length > 1 ? 's' : ''} a vencer en los próximos 30 días.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Proyecto</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Capital</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Vencimiento</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Días</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b">
        <p style="color:#92400e;font-size:13px;margin:0">
          Recuerda que al vencer una inversión puedes renovarla, retirar el capital o reinvertirlo en un nuevo proyecto.
        </p>
      </div>
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Este correo fue enviado automáticamente por InversionTracker. Para dejar de recibirlos, actualiza tus preferencias en la app.
      </p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: 'InversionTracker <alertas@inversiontracker.app>',
      to: email,
      subject: `⏰ ${investments.length} inversión${investments.length > 1 ? 'es' : ''} próxima${investments.length > 1 ? 's' : ''} a vencer`,
      html,
    });
    sent++;
  }

  return NextResponse.json({ sent, total: expiring.length });
}
