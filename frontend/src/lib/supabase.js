import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sljkkoxxqdgxjsuypubn.supabase.co'
const supabaseAnonKey = 'sb_publishable_YGZ4zbwxwSPc1MqBsb0hnQ_plmzNz-p'

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
)
