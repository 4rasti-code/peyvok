import React from 'react';
import ExperienceBar from './ExperienceBar';
import { useGame } from '../context/GameContext';
import { useUser } from '../context/AuthContext';

/**
 * GameWrapper - Global Experience Simulator.
 * Demonstrates how any Game Mode can now trigger global XP rewards.
 */
export default function GameWrapper() {
  const { addXP } = useGame();
  const { loading } = useUser();

  if (loading) {
    return (
      <div style={{ backgroundColor: '#14181f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'white', fontFamily: 'sans-serif' }}>Loading Profile...</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#14181f', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px', paddingLeft: '20px', paddingRight: '20px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '900', fontFamily: 'sans-serif', marginBottom: '10px' }}>سیستەمێ جیھانی یێ ئاستەکان 🌍</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Global RPG Context + Supabase Cloud Sync</p>
      </div>
      
      {/* Global Experience Bar - No props needed! */}
      <ExperienceBar />
      
      <div style={{ marginTop: '80px', padding: '30px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        
        <p style={{ color: 'white', marginBottom: '20px', fontWeight: 'bold' }}>تەقیکردنا ئاستی (Manual Trigger)</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button 
            onClick={() => addXP(500)}
            style={{ padding: '15px', fontSize: '16px', fontWeight: '900', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
          >
            +500 XP ✨
          </button>
          <button 
            onClick={() => addXP(2500)}
            style={{ padding: '15px', fontSize: '16px', fontWeight: '900', backgroundColor: '#FFB800', color: 'black', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
          >
            +2500 XP 🚀
          </button>
        </div>

        <button 
          onClick={() => addXP(15000)}
          style={{ width: '100%', marginTop: '15px', padding: '18px', fontSize: '18px', fontWeight: '900', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 15px rgba(239, 68, 68, 0.3)' }}
        >
          GOD MODE (+15000 XP) ⚡
        </button>
        
        <p style={{ marginTop: '25px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
          ئەڤ داتایە ڕاستەوخۆ د ناڤ Supabase دا پاشەکەفت دبن. <br/>
          (ب کاربینە دا گۆڕانکاریێن ڕەنگان و ئاستی ببینی)
        </p>
      </div>

    </div>
  );
}
