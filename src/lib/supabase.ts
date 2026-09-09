import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgzypgiymfqznumptbws.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_N-Vi7rh62Mgwr0riAH4z4A_6PN42KIU';

export const supabase = createClient(supabaseUrl, supabaseKey);
