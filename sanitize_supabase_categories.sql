-- Peyvok Supabase Category Sanitization Script (Simplified Version)
-- Run this in your Supabase SQL Editor to clean up ghost categories.

-- 1. Update words with unauthorized categories to 'هەمەجۆر' (Miscellaneous)
-- This list defines the ONLY authorized categories.
UPDATE words 
SET category = 'هەمەجۆر'
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
  'کات',
  'جلوبەرگ',
  'جهـ',
  'هەمەجۆر',
  'مامک'
);

-- 2. Explicitly remove the corrupted "بها" category if it exists
DELETE FROM words WHERE category = 'بها' OR category IS NULL OR category = '';

-- 3. Verify results
SELECT DISTINCT category FROM words ORDER BY category;
