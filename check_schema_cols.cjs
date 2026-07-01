const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: ['.env.local', '.env'] });

const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data: resumes } = await supabase.from('email_resumes').select('*').limit(1);
  console.log('email_resumes columns:', resumes && resumes.length > 0 ? Object.keys(resumes[0]) : 'no data');
  
  const { data: evals } = await supabase.from('formative_evaluations').select('*').limit(1);
  console.log('formative_evaluations columns:', evals && evals.length > 0 ? Object.keys(evals[0]) : 'no data');
}
checkSchema();
