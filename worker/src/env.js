export function getRequiredEnv(env) {
  if (!env || !env.DB) {
    throw new Error('Missing required Cloudflare bindings');
  }

  return {
    DB: env.DB,
    ATTACHMENTS: env.ATTACHMENTS ?? null,
    SESSION_SECRET: env.SESSION_SECRET ?? '',
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS ?? ''
  };
}

export function getAllowedOrigins(env) {
  return getRequiredEnv(env)
    .ALLOWED_ORIGINS.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
