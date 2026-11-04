/** Password hashing for the demo backend (SHA-256 + salt). A real backend must use bcrypt/argon2 server-side. */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export const randomId = (len = 10) => {
  const a = new Uint8Array(len);
  (globalThis.crypto || window.crypto).getRandomValues(a);
  return [...a].map(b => (b % 36).toString(36)).join('');
};

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + ':' + password);
  if (globalThis.crypto?.subtle) return hex(await crypto.subtle.digest('SHA-256', data));
  // insecure fallback for non-secure contexts (file://)
  let h = 5381;
  for (const b of data) h = ((h << 5) + h + b) >>> 0;
  return 'fb' + h.toString(16);
}
