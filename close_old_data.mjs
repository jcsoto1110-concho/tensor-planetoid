import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfbrwcflzbauycszajpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYnJ3Y2ZsemJhdXljc3phanBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODk1NTAsImV4cCI6MjA5MjQ2NTU1MH0.mNp3rCrkDKcvMoUCHn5Rf3Ihh2RIxwtc15VsoZvabyQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching old tracking records...');
  const { data, error } = await supabase.from('candidate_tracking')
    .select('id, status')
    .neq('status', 'FORMATIVA_CERRADA');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${data.length} records to close.`);

  if (data.length > 0) {
    const { error: updateError } = await supabase.from('candidate_tracking')
      .update({ status: 'FORMATIVA_CERRADA' })
      .neq('status', 'FORMATIVA_CERRADA');

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Successfully updated records to FORMATIVA_CERRADA.');
    }
  } else {
    console.log('No records needed updating.');
  }
}

run();
