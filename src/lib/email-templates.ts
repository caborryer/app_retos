const BRAND = {
  primary: '#FC0230',
  primaryDark: '#D40128',
  bgOuter: '#0f172a',
  bgCard: '#1e293b',
  bgElevated: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',
  border: '#334155',
  appName: 'Box Challenge',
} as const;

function appUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.APP_URL?.trim() ??
    process.env.NEXTAUTH_URL?.trim() ??
    'http://localhost:3000';
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return raw.replace(/\/$/, '');
  }
}

function logoUrl(): string {
  return `${appUrl()}/images/box-logo.png`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Base responsive layout — table-based for broad client support */
function emailLayout(options: {
  preheader: string;
  title: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  const year = new Date().getFullYear();
  const footer =
    options.footerHtml ??
    `
    <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${BRAND.textSubtle};">
      © ${year} ${BRAND.appName}. Todos los derechos reservados.
    </p>
    <p style="margin:0;font-size:11px;line-height:1.5;color:${BRAND.textSubtle};">
      Este es un mensaje automático; no respondas a este correo.
    </p>`;

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(options.title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    #outlook a { padding: 0; }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: ${BRAND.primary}; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .email-card-pad { padding: 28px 22px !important; }
      .email-hero-title { font-size: 22px !important; line-height: 1.3 !important; }
      .email-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .email-logo { width: 56px !important; height: 56px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgOuter};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(options.preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.bgOuter};">
    <tr>
      <td align="center" style="padding:32px 16px;" class="email-padding">
        <table role="presentation" class="email-container" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
          <!-- Header / logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color:${BRAND.bgCard};border-radius:16px;padding:16px 24px;border:1px solid ${BRAND.border};">
                    <img
                      src="${logoUrl()}"
                      alt="${BRAND.appName}"
                      width="64"
                      height="64"
                      class="email-logo"
                      style="display:block;width:64px;height:64px;border-radius:12px;"
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main card -->
          <tr>
            <td style="background-color:${BRAND.bgCard};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <!-- Accent bar -->
                <tr>
                  <td height="4" style="background:linear-gradient(90deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="email-card-pad" style="padding:36px 40px;">
                    ${options.bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 8px 8px;" class="email-padding">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto;">
      <tr>
        <td align="center" style="border-radius:12px;background-color:${BRAND.primary};">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="25%" strokecolor="${BRAND.primary}" fillcolor="${BRAND.primary}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${safeLabel}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a
            href="${safeHref}"
            class="email-btn"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;background-color:${BRAND.primary};mso-padding-alt:0;"
          >${safeLabel}</a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>`;
}

function infoBox(html: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
      <tr>
        <td style="background-color:${BRAND.bgElevated};border-radius:10px;padding:14px 16px;border-left:3px solid ${BRAND.primary};">
          ${html}
        </td>
      </tr>
    </table>`;
}

export function verificationEmailHtml(verifyUrl: string, name: string): string {
  const safeName = escapeHtml(name.trim() || 'ahí');
  const safeUrl = escapeHtml(verifyUrl);

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.primary};">
      Verificación de cuenta
    </p>
    <h1 class="email-hero-title" style="margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.25;color:${BRAND.text};">
      Confirma tu correo
    </h1>
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${BRAND.textMuted};">
      Hola <strong style="color:${BRAND.text};">${safeName}</strong>,
    </p>
    <p style="margin:0;font-size:16px;line-height:1.65;color:${BRAND.textMuted};">
      Gracias por unirte a <strong style="color:${BRAND.text};">${BRAND.appName}</strong>.
      Solo falta un paso: confirma que este correo es tuyo para activar tu cuenta y empezar con tus retos.
    </p>
    ${ctaButton(verifyUrl, 'Confirmar mi correo')}
    <p style="margin:0;text-align:center;font-size:14px;line-height:1.5;color:${BRAND.textSubtle};">
      El enlace es válido durante <strong style="color:${BRAND.textMuted};">48 horas</strong>.
    </p>
    ${infoBox(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${BRAND.text};">
        ¿El botón no funciona?
      </p>
      <p style="margin:0;font-size:12px;line-height:1.55;color:${BRAND.textMuted};word-break:break-all;">
        Copia y pega este enlace en tu navegador:<br />
        <a href="${safeUrl}" style="color:${BRAND.primary};text-decoration:underline;">${safeUrl}</a>
      </p>
    `)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;border-top:1px solid ${BRAND.border};">
      <tr>
        <td style="padding-top:20px;">
          <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.textSubtle};">
            Si no creaste una cuenta en ${BRAND.appName}, puedes ignorar este mensaje con tranquilidad.
          </p>
        </td>
      </tr>
    </table>`;

  return emailLayout({
    preheader: `${name.trim() || 'Usuario'}, confirma tu correo para activar tu cuenta en ${BRAND.appName}.`,
    title: 'Confirma tu correo — Box Challenge',
    bodyHtml,
  });
}

export function verificationEmailText(verifyUrl: string, name: string): string {
  const greeting = name.trim() ? `Hola ${name.trim()},` : 'Hola,';
  return `${greeting}

Gracias por registrarte en ${BRAND.appName}.

Confirma tu correo para activar tu cuenta:
${verifyUrl}

El enlace expira en 48 horas.

Si no creaste esta cuenta, ignora este mensaje.

— ${BRAND.appName}`;
}

export function buildVerifyEmailUrl(rawToken: string): string {
  return `${appUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
}
