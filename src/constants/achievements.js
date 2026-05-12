/**
 * Achievement System Configuration
 * Defines tiers, thresholds, and metadata for the 8 core achievements.
 */

export const TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  DIAMOND: '#B9F2FF'
};

export const ACHIEVEMENTS_CONFIG = [
  {
    id: 'flawless_words',
    name: 'پەیڤێن بێ خەلەتی',
    description: 'سەرکەفتن بێ چ هاریکارییەکێ (Hints)',
    icon: 'verified',
    statKey: 'flawless_wins',
    thresholds: [50, 250, 500, 1000]
  },
  {
    id: 'word_collector',
    name: 'کۆکەرەوەیێ پەیڤان',
    description: 'کۆما هەمی پەیڤێن تە دیتین',
    icon: 'inventory_2',
    statKey: 'total_words_found',
    thresholds: [500, 2500, 5000, 10000]
  },
  {
    id: 'night_phantom',
    name: 'سێبەرا شەڤێ',
    description: 'سەرکەفتن د مۆدێ پەیڤا نهێنی دا',
    icon: 'visibility_off',
    statKey: 'secret_wins',
    thresholds: [50, 150, 300, 500]
  },
  {
    id: 'culture_guardian',
    name: 'پارێزەرێ کەلتووری',
    description: 'سەرکەفتن د مامکان دا بێی بکارهینانا Skip',
    icon: 'auto_stories',
    statKey: 'riddles_no_skip',
    thresholds: [100, 300, 600, 1000]
  },
  {
    id: 'flawless_streak',
    name: 'زنجیرەیا پۆڵایین',
    description: 'مەزنترین زنجیرەیا سەرکەفتنان',
    icon: 'local_fire_department',
    statKey: 'max_streak',
    thresholds: [10, 25, 50, 100]
  },
  {
    id: 'word_master',
    name: 'شارەزایێ پەیڤان',
    description: 'بلندترین نمرە د مۆدێ تایا پەیڤان دا',
    icon: 'bolt',
    statKey: 'fever_highscore',
    thresholds: [8, 10, 12, 15]
  },
  {
    id: 'unbroken_chain',
    name: 'زنجیرەیا نەبڕی',
    description: 'کۆما هەمی ڕۆژێن تە یاری تێدا کری',
    icon: 'calendar_month',
    statKey: 'total_active_days',
    thresholds: [30, 100, 200, 365]
  },
  {
    id: 'pvp_champion',
    name: 'قەهرەمانێ هەڤڕکیێ',
    description: 'سەرکەفتن ب ئەنجامێ (٣-٠) د هەڤڕکیان دا',
    icon: 'swords',
    statKey: 'pvp_flawless_wins',
    thresholds: [50, 150, 300, 500]
  }
];

export const TIER_NAMES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'];
