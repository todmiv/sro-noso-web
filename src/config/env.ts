export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
  },
};