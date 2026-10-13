import 'server-only';

/**
 * Outbound mail, behind one function.
 *
 * The scope puts third-party accounts in TAF's name, so this deliberately
 * does not assume a provider. It speaks Resend's HTTP API when the key is
 * present - no dependency, one fetch - and otherwise writes the message to
 * the server log so the reset flow is still exercisable on a machine with no
 * mail account configured. Swapping Resend for SES, Postmark or an SMTP
 * relay means editing `send` and nothing else.
 *
 * Environment:
 *   RESEND_API_KEY   enables real delivery
 *   MAIL_FROM        e.g. "Strivers' Hub <no-reply@strivershub.com>"
 */

export type Mail = { to: string; subject: string; text: string; html: string };

export async function send(mail: Mail): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!key || !from) {
    // Never throw: a missing mail account must not turn into a 500 on a form
    // the visitor cannot fix. The caller reports success either way, because
    // saying "no such account" would let the form enumerate who has one.
    console.warn(
      `[mail] RESEND_API_KEY or MAIL_FROM not set - not delivered.\n` +
        `  to: ${mail.to}\n  subject: ${mail.subject}\n\n${mail.text}\n`,
    );
    return { delivered: false };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
    });
    if (!res.ok) {
      console.error('[mail] provider rejected the message', res.status, await res.text());
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error('[mail] send failed', err);
    return { delivered: false };
  }
}

/** The one transactional message the platform sends today. */
export function resetMail(link: string, lang: 'en' | 'bm'): Omit<Mail, 'to'> {
  const en = {
    subject: "Reset your Strivers' Hub password",
    lead: 'We received a request to reset your password. Open the link below to choose a new one. It expires in one hour.',
    cta: 'Choose a new password',
    ignore: 'If you did not ask for this, you can ignore this email - your password will not change.',
  };
  const bm = {
    subject: "Tetapkan semula kata laluan Strivers' Hub anda",
    lead: 'Kami menerima permintaan untuk menetapkan semula kata laluan anda. Buka pautan di bawah untuk memilih kata laluan baharu. Ia akan tamat tempoh dalam satu jam.',
    cta: 'Pilih kata laluan baharu',
    ignore: 'Jika anda tidak membuat permintaan ini, abaikan e-mel ini - kata laluan anda tidak akan berubah.',
  };
  const c = lang === 'bm' ? bm : en;

  return {
    subject: c.subject,
    text: `${c.lead}\n\n${link}\n\n${c.ignore}`,
    html: `<!doctype html><html><body style="margin:0;background:#FFF6F1;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1A0B15">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:18px;padding:34px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#B12069;padding-bottom:14px">Strivers' Hub</td></tr>
<tr><td style="font-size:16px;line-height:1.6;color:#4A3542;padding-bottom:26px">${c.lead}</td></tr>
<tr><td style="padding-bottom:26px"><a href="${link}" style="display:inline-block;background:#822B62;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:700;font-size:15px">${c.cta}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.6;color:#7B6675">${c.ignore}</td></tr>
</table></td></tr></table></body></html>`,
  };
}
