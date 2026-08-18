import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Cliente para el frontend/navegador (Usa ANON key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente administrativo para API routes en el servidor (Usa SERVICE_ROLE para omitir RLS de forma segura)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

