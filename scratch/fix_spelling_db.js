import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://phmztiiabmkdotxkyxtk.supabase.co'
const supabaseKey = 'sb_publishable_4jqo-mI91tJ1DFTwTFFttQ_RqZS8snj'
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixWord() {
  console.log('Searching for "هەژیر" in database...');
  
  // Try different encodings
  const variations = ["هەژیر", "ھەژیر", "هَژیر"];
  
  for (const v of variations) {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('word', v);
      
    if (data && data.length > 0) {
      console.log(`Found match for "${v}":`, data);
      const { error: updateError } = await supabase
        .from('words')
        .update({ word: 'هێژیر' })
        .eq('word', v);
        
      if (updateError) {
        console.error('Update failed:', updateError);
      } else {
        console.log(`Successfully updated "${v}" to "هێژیر"`);
      }
    } else {
        console.log(`No match for "${v}"`);
    }
  }
}

fixWord();
