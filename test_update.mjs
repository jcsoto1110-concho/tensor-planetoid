import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('email_resumes')
    .select('id, classification_status')
    .limit(1);
    
  if (data && data.length > 0) {
    const { error: updateError } = await supabase
      .from('email_resumes')
      .update({ classification_status: 'MANUALLY_REVIEWED' })
      .eq('id', data[0].id);
    console.log("Update Error:", updateError);
    
    // Revert
    await supabase
      .from('email_resumes')
      .update({ classification_status: data[0].classification_status })
      .eq('id', data[0].id);
  }
}
main();
