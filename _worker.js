/**
 * CoastLink Solutions — Cloudflare Worker
 * Handles POST /api/contact → sends email via Resend
 *
 * Environment variables (set in Cloudflare Pages dashboard → Settings → Environment variables):
 *   RESEND_API_KEY   your Resend API key  (re_xxxxxxxxxxxxxxxx)
 *   TO_EMAIL         where leads land     (e.g. info@coastlinksolutions.com)
 *   FROM_EMAIL       verified Resend sender (e.g. noreply@coastlinksolutions.com)
 */

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') return corsResponse(204);

    // Pass everything except /api/contact through to static assets
    if (url.pathname !== '/api/contact') {
      return env.ASSETS.fetch(request);
    }

    // Only accept POST for the contact endpoint
    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'Invalid JSON');
    }

    const { firstName, lastName, phone, email, business, service, message } = body;

    if (!firstName || !email) {
      return jsonError(400, 'Name and email are required');
    }

    const html = buildEmail({ firstName, lastName, phone, email, business, service, message });

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to:   env.TO_EMAIL,
          reply_to: email,
          subject: `New Lead: ${firstName} ${lastName || ''} — ${service || 'General Inquiry'}`,
          html,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.text();
        console.error('Resend error:', err);
        return jsonError(502, 'Email delivery failed');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });

    } catch (err) {
      console.error('Worker error:', err);
      return jsonError(500, 'Internal error');
    }
  }
};

function buildEmail({ firstName, lastName, phone, email, business, service, message }) {
  const row = (label, value, highlight = false) => value ? `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:140px;font-size:13px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;${highlight ? 'color:#00b8a0;font-weight:bold;' : ''}">${value}</td>
    </tr>` : '';

  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#0d1117;padding:24px 32px;border-bottom:2px solid #00b8a0;">
      <h1 style="color:#eef2f7;font-size:22px;margin:0;">New Lead — CoastLink Solutions</h1>
    </div>
    <div style="background:#fff;padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Name',       `${firstName} ${lastName || ''}`)}
        ${row('Email',      `<a href="mailto:${email}">${email}</a>`)}
        ${row('Phone',      phone ? `<a href="tel:${phone}">${phone}</a>` : '')}
        ${row('Business',   business)}
        ${row('Interested In', service, true)}
      </table>
      ${message ? `
      <div style="margin-top:24px;">
        <div style="color:#666;font-size:13px;margin-bottom:10px;">Message</div>
        <div style="background:#f8f9fa;padding:16px;border-left:3px solid #00b8a0;font-size:15px;line-height:1.6;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
      </div>` : ''}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#999;">
        Submitted via coastlinksolutions.com &middot; ${ts} CT
      </div>
    </div>
  </div>`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  'https://coastlinksolutions.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function corsResponse(status) {
  return new Response(null, { status, headers: corsHeaders() });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
