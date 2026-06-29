import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfbrwcflzbauycszajpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYnJ3Y2ZsemJhdXljc3phanBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODk1NTAsImV4cCI6MjA5MjQ2NTU1MH0.mNp3rCrkDKcvMoUCHn5Rf3Ihh2RIxwtc15VsoZvabyQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching formative_candidates to delete...');
  const { data, error } = await supabase.from('formative_candidates').select('id');
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${data.length} formative_candidates to delete.`);

  if (data.length > 0) {
    const ids = data.map(r => r.id);
    const { error: deleteError } = await supabase.from('formative_candidates')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log('Successfully deleted formative_candidates.');
    }
  } else {
    console.log('No records needed deleting.');
  }
}

run();
