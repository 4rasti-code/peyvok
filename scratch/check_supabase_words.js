import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkWords() {
    console.log('Fetching words from Supabase...');
    const { data, error } = await supabase.from('words').select('*').limit(5);
    
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    
    console.log('Successfully fetched words:', data);
}

checkWords();
