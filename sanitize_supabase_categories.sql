-- Peyvok Supabase Category Audit & Cleanup Script
-- Run this in your Supabase SQL Editor to manage your word taxonomy.

-- 1. AUDIT: Identify words with potentially unauthorized or legacy categories
-- This helps you find words that need to be re-categorized manually to their specific "own category".
SELECT id, word, category, hint 
FROM words 
WHERE category NOT IN (
  'ناڤێ مرۆڤان',
  'وەسف(هەڤالناڤ)',
  'هەست',
  'باژێڕ',
  'پیشە',
  'ئەندامێ لەشی',
  'سرۆشت',
  'کار (چاوگ)',
  'کەلوپەل',
  'گیانەوەر',
  'هونەر',
  'میوە',
  'ڕەنگ',
  'وەلات',
  'خێزان',
  'خوارن',
  'دەم',
  'جلوبەرگ',
  'جهـ',
  'مامک'
) OR category IS NULL OR category = '';

-- 2. CLEANUP: Remove words with no category or empty strings (Data Integrity)
-- Only run this if you want to remove corrupted records.
-- DELETE FROM words WHERE category IS NULL OR category = '';

-- 3. VERIFICATION: List all active categories in your database
SELECT category, COUNT(*) as word_count 
FROM words 
GROUP BY category 
ORDER BY word_count DESC;

-- IMPORTANT: The application no longer uses a 'Miscellaneous' or 'General' fallback.
-- Every word will be displayed under its stored category. Ensure all words have meaningful categories.
