import nodemailer, { type Transporter } from 'nodemailer';
import {
  buildVerifyEmailUrl,
  verificationEmailHtml,
  verificationEmailText,
} from '@/lib/email-templates';

/**
 * Envío de correo para verificación de email.
 * MFA (TOTP) no usa este módulo.
 *
 * Orden de preferencia:
 * 1. BREVO_API_KEY — API HTTP (recomendado en local/Vercel; sin whitelist de IP SMTP)
 * 2. SMTP_* — Gmail, Brevo SMTP, etc.
 * 3. Desarrollo sin proveedor → enlace en consola / UI
 */

export type SendEmailResult = { sent: boolean; devLink?: string };

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function fromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error('EMAIL_FROM is not configured (ej. "Box Challenge <noreply@dominio.com>")');
  }
  if (/tu-email-verificado|example\.com|tu@gmail\.com|noreply@example/i.test(from)) {
    throw new Error(
      'EMAIL_FROM sigue siendo un placeholder. Usa un remitente verificado en Brevo (Senders & Domains).'
    );
  }
  return from;
}

function parseEmailFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim(),
    };
  }
  return { email: from.trim() };
}

function isBrevoApiConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim());
}

function isEmailProviderConfigured(): boolean {
  return isBrevoApiConfigured() || isSmtpConfigured();
}

let cachedTransport: Transporter | null = null;

function getSmtpTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT ?? '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS?.trim() ?? '';

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransport;
}

async function sendViaBrevoApi(payload: MailPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY!.trim();
  const sender = parseEmailFrom(fromAddress());

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: sender.name, email: sender.email },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo API ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function sendViaSmtp(payload: MailPayload): Promise<void> {
  const transport = getSmtpTransport();
  await transport.sendMail({
    from: fromAddress(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

function logDevLink(verifyUrl: string, reason: string): SendEmailResult {
  console.info(`[email] ${reason} — enlace de verificación:`, verifyUrl);
  return { sent: false, devLink: verifyUrl };
}

async function dispatchEmail(payload: MailPayload): Promise<void> {
  if (isBrevoApiConfigured()) {
    await sendViaBrevoApi(payload);
    return;
  }
  if (isSmtpConfigured()) {
    await sendViaSmtp(payload);
    return;
  }
  throw new Error('No email provider configured');
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  rawToken: string;
}): Promise<SendEmailResult> {
  const verifyUrl = buildVerifyEmailUrl(params.rawToken);
  const subject = 'Confirma tu correo — Box Challenge';
  const html = verificationEmailHtml(verifyUrl, params.name);
  const text = verificationEmailText(verifyUrl, params.name);
  const payload: MailPayload = { to: params.to, subject, html, text };

  if (!isEmailProviderConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      return logDevLink(verifyUrl, 'proveedor no configurado');
    }
    throw new Error('Configura BREVO_API_KEY o SMTP_* y EMAIL_FROM.');
  }

  try {
    await dispatchEmail(payload);
    console.info('[email] correo de verificación enviado a', params.to.replace(/(.{2}).*(@.*)/, '$1***$2'));
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] envío fallido:', message);

    if (process.env.NODE_ENV === 'development') {
      if (message.includes('Unauthorized IP')) {
        console.error(
          '[email] Brevo bloqueó SMTP por IP. Usa BREVO_API_KEY (API HTTP) o autoriza tu IP en Brevo → Security.'
        );
      }
      return logDevLink(verifyUrl, 'envío fallido (modo desarrollo)');
    }
    throw err;
  }
}
