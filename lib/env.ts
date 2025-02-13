const getEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

export const env = {
  NEXT_PUBLIC_PRODUCTION_URL: getEnvVar('NEXT_PUBLIC_PRODUCTION_URL'),
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  NEXT_SUPABASE_SERVICE_KEY: getEnvVar('NEXT_SUPABASE_SERVICE_KEY'),
  // LINKEDIN_CLIENT_ID: getEnvVar('LINKEDIN_CLIENT_ID'),
  // LINKEDIN_CLIENT_SECRET: getEnvVar('LINKEDIN_CLIENT_SECRET'),
  // LINKEDIN_ACCESS_TOKEN: getEnvVar('LINKEDIN_ACCESS_TOKEN'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
  UNIPILE_DNS: getEnvVar('UNIPILE_DNS'),
  UNIPILE_ACCESS_TOKEN: getEnvVar('UNIPILE_ACCESS_TOKEN'),
} as const
