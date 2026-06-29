import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('onboarding_candidates')
    .select('*')
    .limit(1);
    
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
    console.log("form_data type:", typeof data[0].form_data);
    if (data[0].form_data) console.log(Object.keys(data[0].form_data));
  }
}
main();
