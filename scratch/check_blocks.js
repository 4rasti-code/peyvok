/* global process */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBlocksTable() {
  console.log("Checking 'blocks' table...");
  const { data, error } = await supabase.from('blocks').select('*').limit(1);
  if (error) {
    console.error('Error fetching blocks:', JSON.stringify(error, null, 2));
    if (error.code === '42P01') {
      console.log("Table 'blocks' does not exist.");
    }
  } else {
    console.log("Table 'blocks' exists. Columns:", data.length > 0 ? Object.keys(data[0]) : "Unknown (no rows)");
    
    // Check schema directly if no rows
    if (data.length === 0) {
       const { data: colData, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'blocks' });
       if (!colError) {
          console.log("Columns (via RPC):", colData);
       }
    }
  }
}

checkBlocksTable();
