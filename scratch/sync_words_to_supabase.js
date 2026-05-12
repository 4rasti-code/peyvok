import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { wordList } from '../src/data/wordList.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const normalizeKurdishInput = (input) => {
  if (!input) return '';
  return input.trim()
    .replace(/ك/g, 'ک')
    .replace(/[يى]/g, 'ی')
    .replace(/ه/g, 'ھ'); // Normalize to Kurdish ھ
};

async function syncWords() {
  console.log('Starting intelligent sync process...');
  
  // 1. Fetch all words from Supabase
  const { data: dbWords, error: fetchError } = await supabase.from('words').select('id, word, definition');
  if (fetchError) {
    console.error('Error fetching words:', fetchError.message);
    return;
  }
  console.log(`Fetched ${dbWords.length} words from DB.`);

  // 2. Prepare local words
  const localWords = [];
  Object.keys(wordList).forEach(category => {
    wordList[category].forEach(item => {
      localWords.push({ word: item.word, definition: item.hint });
    });
  });

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 3. Compare and Update
  for (const localItem of localWords) {
    const normalizedLocal = normalizeKurdishInput(localItem.word);
    
    // Find matching record in DB (normalized)
    const match = dbWords.find(dbItem => normalizeKurdishInput(dbItem.word) === normalizedLocal);
    
    if (match) {
      // If found, check if it actually needs updating (exact string match)
      if (match.word !== localItem.word || match.definition !== localItem.definition) {
        console.log(`Updating word ID ${match.id}: "${match.word}" -> "${localItem.word}"`);
        
        const { error: updateError } = await supabase
          .from('words')
          .update({ 
            word: localItem.word, 
            definition: localItem.definition 
          })
          .eq('id', match.id);
          
        if (updateError) {
          console.error(`Error updating ID ${match.id}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    } else {
      // Word not in DB at all (optional: insert)
      // console.log(`Word not in DB: ${localItem.word}`);
    }
  }

  console.log(`\nSync Summary:`);
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Already Correct: ${skippedCount}`);
  console.log(`- Errors: ${errorCount}`);
}

syncWords();
