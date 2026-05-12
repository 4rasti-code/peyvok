import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const newWords = [
  { word: 'ئاگر', definition: 'ھەوا ژیانێ ددەتە من، لێ ئاڤ من دکوژیت.', category: 'سرۆشت' },
  { word: 'نھێنی', definition: 'ئەگەر تو من بپارێزی ئەز یێ ھەیم، تو من ئاشکرا بکەی ئەز نامینم!', category: 'پەیڤێن نەھێنی' },
  { word: 'تاڕیاتی', definition: 'ڕۆناھی ژیانێ ددەتە ھەمی تشتان، لێ من دکوژیت.', category: 'سرۆشت' },
  { word: 'بێدەنگی', definition: 'ب تنێ گۆتنا ناڤێ من، من ژناڤ دبەت.', category: 'پەیڤێن دژوار' },
  { word: 'پیڤاز', definition: 'تو کێرێکێ ل من ددەی، لێ ھێستر ژ چاڤێن تە ب خوە دبارن!', category: 'خوارن' },
  { word: 'سوبەھی', definition: 'ئەز ھەردەم یێ د ڕێکێدا، لێ چ جاران ناگەھم.', category: 'پەیڤێن نەھێنی' },
  { word: 'درێزیک', definition: 'چاڤەکێ مەزن یێ ب منڤە، لێ ئەز چ نابینم.', category: 'کەلوپەل' },
  { word: 'چاڵ', definition: 'ھەرچەند تو پتر ژ من ببەی، ئەز مەزنتر لێ دھێم.', category: 'سرۆشت' },
  { word: 'مریشک', definition: 'ژبەری ئەز ژ دایک ببم، ئەز دھێمە خوارن.', category: 'گیانەوەر' },
  { word: 'ئیسفەنج', definition: 'ئەز ھەردەم تژی ئاڤم، لێ جھێ من یێ ھشکە.', category: 'کەلوپەل' }
];

async function pushWords() {
  console.log("Pushing words to Supabase...");
  const { data, error } = await supabase.from('words').insert(newWords);
  if (error) {
    console.error("Error pushing words:", error);
  } else {
    console.log("Successfully pushed 10 words to Supabase!");
  }
}

pushWords();
