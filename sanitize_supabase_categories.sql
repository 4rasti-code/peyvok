-- Peyvok Supabase Category Sanitization Script
-- Run this in your Supabase SQL Editor to clean up ghost categories.

-- 1. Create a temporary table with the official categories
CREATE TEMP TABLE official_categories (name text);
INSERT INTO official_categories (name) VALUES 
('ناڤێ مرۆڤان'),
('وەسف(هەڤالناڤ)'),
('هەست'),
('باژێڕ'),
('پیشە'),
('ئەندامێ لەشی'),
('سرۆشت'),
('کار (چاوگ)'),
('کەلوپەل'),
('گیانەوەر'),
('هونەر'),
('میوە'),
('ڕەنگ'),
('وەلات'),
('خێزان'),
('خوارن'),
('کات'),
('جلوبەرگ'),
('جهـ'),
('هەمەجۆر'),
('مامک'); -- Mamak is allowed as it is a game mode category

-- 2. Update words with unauthorized categories to 'هەمەجۆر' (Miscellaneous)
UPDATE words 
SET category = 'هەمەجۆر'
WHERE category NOT IN (SELECT name FROM official_categories);

-- 3. (Optional) Remove words with specifically corrupted or unwanted categories
-- Example: DELETE FROM words WHERE category = 'بها';
DELETE FROM words WHERE category = 'بها' OR category IS NULL OR category = '';

-- 4. Clean up
DROP TABLE official_categories;

-- Verify results
SELECT DISTINCT category FROM words ORDER BY category;
