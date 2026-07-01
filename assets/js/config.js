window.FRIENDCIRCLE_CONFIG = {
  ...(window.FRIENDCIRCLE_CONFIG || {}),
  // Set apiBase to your Worker URL before deploying the static site.
  // Example: apiBase: 'https://friendcircle-api.<your-subdomain>.workers.dev'
  apiBase: (window.FRIENDCIRCLE_CONFIG && window.FRIENDCIRCLE_CONFIG.apiBase) || 'https://friendcircle-api.1922554788.workers.dev',
  // Optional local override for development.
  localApiBase: (window.FRIENDCIRCLE_CONFIG && window.FRIENDCIRCLE_CONFIG.localApiBase) || 'http://127.0.0.1:8787'
};
