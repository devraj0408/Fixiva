const OTP_TTL_MS = 5 * 60 * 1000;

export const createOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const getOtpStorageKey = (identifier, purpose) => `fixiva:${purpose}:${String(identifier || '').trim().toLowerCase()}`;

export const storeOtpRecord = (identifier, purpose, code, metadata = {}) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  const payload = { code, expiresAt: Date.now() + OTP_TTL_MS, metadata };
  window.sessionStorage.setItem(getOtpStorageKey(identifier, purpose), JSON.stringify(payload));
  return payload;
};

export const readOtpRecord = (identifier, purpose) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  const raw = window.sessionStorage.getItem(getOtpStorageKey(identifier, purpose));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearOtpRecord = (identifier, purpose) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  window.sessionStorage.removeItem(getOtpStorageKey(identifier, purpose));
};

export const sendOtpEmail = async ({ to, code, purpose, name = '' }) => {
  const resendApiKey = import.meta?.env?.VITE_RESEND_API_KEY || '';

  if (!resendApiKey) {
    return { success: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Fixiva <onboarding@fixiva.app>',
      to: [to],
      subject: `Your Fixiva ${purpose === 'sign-up' ? 'verification' : 'login'} code`,
      text: `Hello ${name || 'there'},\n\nYour Fixiva verification code is ${code}.\n\nUse this code to continue your ${purpose === 'sign-up' ? 'account creation' : 'sign in'} request.\n\nThis code expires in 5 minutes.`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to send verification email.');
  }

  return { success: true };
};
