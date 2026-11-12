// src/app/email.ts
// EmailJS REST sender (no SDK). Keys live in .env.local (Vite exposes VITE_* to the client;
// EmailJS public keys are designed for browser use).
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export const emailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

export async function sendOtpEmail(toEmail: string, toName: string, code: string) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('Email service is not configured. Add the VITE_EMAILJS_* keys to .env.local.');
  }
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        to_name: toName,
        otp_code: code,
        app_name: 'SewsEra',
      },
    }),
  });
  if (!res.ok) {
    console.error('EmailJS send failed:', await res.text());
    throw new Error('Could not send the verification email. Please try again.');
  }
}
