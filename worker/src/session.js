async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPasscode(passcode, secret) {
  return sha256Hex(`${secret}:${passcode}`);
}

export function createSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function hashSessionToken(token, secret) {
  return sha256Hex(`${secret}:${token}`);
}
