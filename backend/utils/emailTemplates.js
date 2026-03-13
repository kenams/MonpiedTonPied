const brand = {
    name: 'MonPiedTonPied',
    accent: '#c7a46a',
    accentDark: '#8f6b39',
    background: '#0e0d12',
    text: '#f4ede3',
    muted: '#b7ad9c',
};

const logoSvg = `
<svg width="52" height="52" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logo MonPiedTonPied">
  <defs>
    <linearGradient id="footGradientEmail" x1="8" y1="8" x2="56" y2="56">
      <stop offset="0%" stop-color="${brand.accent}" />
      <stop offset="100%" stop-color="${brand.accentDark}" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="rgba(20,19,26,0.9)" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <ellipse cx="30" cy="40" rx="14" ry="18" fill="url(#footGradientEmail)" />
  <circle cx="20" cy="20" r="4" fill="url(#footGradientEmail)" />
  <circle cx="30" cy="16" r="4.5" fill="url(#footGradientEmail)" />
  <circle cx="40" cy="20" r="4" fill="url(#footGradientEmail)" />
  <circle cx="47" cy="26" r="3.4" fill="url(#footGradientEmail)" />
  <circle cx="16" cy="26" r="3.4" fill="url(#footGradientEmail)" />
</svg>
`;

const wrapHtml = (title, bodyHtml) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:${brand.background};color:${brand.text};font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px;">
      ${bodyHtml}
    </div>
  </body>
</html>
`;

const copy = {
    fr: {
        eyebrow: 'Acces premium et creatrices',
        verifySubject: 'Verification email MonPiedTonPied',
        verifyGreeting: (name) => (name ? `Bonjour ${name},` : 'Bonjour,'),
        verifyIntro: "Merci pour ton inscription. Confirme ton email pour activer ton compte.",
        verifyCta: 'Verifier mon email',
        resetSubject: 'Reinitialisation mot de passe',
        resetGreeting: (name) => (name ? `Bonjour ${name},` : 'Bonjour,'),
        resetIntro: 'Tu as demande une reinitialisation de mot de passe.',
        resetCta: 'Reinitialiser mon mot de passe',
        directLink: 'Lien direct:',
        footer: "Tu peux ignorer cet email si tu n'es pas a l'origine de la demande.",
    },
    en: {
        eyebrow: 'Premium access and creators',
        verifySubject: 'Verify your email',
        verifyGreeting: (name) => (name ? `Hi ${name},` : 'Hi,'),
        verifyIntro: 'Thanks for signing up. Please verify your email to activate your account.',
        verifyCta: 'Verify my email',
        resetSubject: 'Password reset',
        resetGreeting: (name) => (name ? `Hi ${name},` : 'Hi,'),
        resetIntro: 'You requested a password reset.',
        resetCta: 'Reset my password',
        directLink: 'Direct link:',
        footer: 'You can ignore this email if you did not request it.',
    },
};

const resolveLocale = (locale) => (locale === 'en' ? 'en' : 'fr');

const wrapEmail = ({ title, bodyHtml, locale }) => {
    const lang = copy[resolveLocale(locale)];
    return wrapHtml(
        title,
        `
        <div style="display:flex;align-items:center;gap:14px;">
          <div>${logoSvg}</div>
          <div>
            <div style="font-size:20px;font-weight:700;letter-spacing:0.08em;">${brand.name}</div>
            <div style="font-size:12px;color:${brand.muted};text-transform:uppercase;letter-spacing:0.18em;">${lang.eyebrow}</div>
          </div>
        </div>
        <div style="height:2px;background:linear-gradient(90deg, ${brand.accent} 0%, ${brand.accentDark} 100%);margin:16px 0 24px 0;"></div>
        ${bodyHtml}
        <div style="margin-top:32px;font-size:12px;color:${brand.muted};">
          ${lang.footer}
        </div>
      `
    );
};

const verificationEmail = ({ displayName, verifyUrl, locale }) => {
    const lang = copy[resolveLocale(locale)];
    const greeting = lang.verifyGreeting(displayName);
    const html = wrapEmail({
        title: lang.verifySubject,
        locale,
        bodyHtml: `
          <p style="font-size:16px;">${greeting}</p>
          <p style="font-size:15px;color:${brand.muted};">${lang.verifyIntro}</p>
          <a href="${verifyUrl}" style="display:inline-block;margin-top:16px;padding:12px 20px;background:${brand.accent};color:#0b0a0f;text-decoration:none;border-radius:999px;font-weight:700;">
            ${lang.verifyCta}
          </a>
          <p style="margin-top:16px;font-size:12px;color:${brand.muted};">
            ${lang.directLink} ${verifyUrl}
          </p>
        `,
    });
    const text = `${greeting}\n\n${lang.verifyIntro}\n${lang.directLink} ${verifyUrl}\n\n${brand.name}`;
    return { subject: lang.verifySubject, html, text };
};

const resetEmail = ({ displayName, resetUrl, locale }) => {
    const lang = copy[resolveLocale(locale)];
    const greeting = lang.resetGreeting(displayName);
    const html = wrapEmail({
        title: lang.resetSubject,
        locale,
        bodyHtml: `
          <p style="font-size:16px;">${greeting}</p>
          <p style="font-size:15px;color:${brand.muted};">${lang.resetIntro}</p>
          <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 20px;background:${brand.accent};color:#0b0a0f;text-decoration:none;border-radius:999px;font-weight:700;">
            ${lang.resetCta}
          </a>
          <p style="margin-top:16px;font-size:12px;color:${brand.muted};">
            ${lang.directLink} ${resetUrl}
          </p>
        `,
    });
    const text = `${greeting}\n\n${lang.resetIntro}\n${lang.directLink} ${resetUrl}\n\n${brand.name}`;
    return { subject: lang.resetSubject, html, text };
};

module.exports = { verificationEmail, resetEmail };
