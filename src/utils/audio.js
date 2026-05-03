/**
 * Premium Game Audio Engine (Web Audio API)
 * Optimized for low-latency, polyphony, and high-performance streaming.
 */

const SFX_PATHS = {
  CLICK: '/click.mp3',
  POP: '/pop.mp3',
  NOTIFICATION: '/ui_sfx_notification.wav',
  SETTINGS_OPEN: '/ui_sfx_menu_open.wav',
  SETTINGS_CLOSE: '/ui_sfx_menu_close.wav',
  ALERT: '/ui_sfx_alert.wav',
  START_GAME: '/ui_sfx_start_button.wav',
  BACK: '/ui_sfx_menu_close.wav',
  SAVE: '/minimal-pop-click-save.ui.wav',
  TAB: '/punchy-taps-ui.wav',
  VICTORY: '/victory.mp3',
  DAILY_OPEN: '/wooden-trunk-latch-ui.wav',
  DAILY_CLAIM: '/coin-jingle-trio-89078.wav', 
  BUBBLE_POP: '/bubble-poP.wav',
  PURCHASE: '/coin-drop-229314.wav',
  EARNING: '/coin-jingle-trio-89078.wav',
  BOOSTER: '/hit-shell-01-266294.wav',
  SWORD_COMBO: '/freesound_crunchpixstudio-rpg-sword-attack-combo-34-388950.mp3',
  SWORD_SLASH: '/gargamel10-sword-slashing-game-sound-effect-2-379229.mp3',
  WHOOSH: '/lordsonny-whoosh-cinematic-161021.mp3',
  MESSAGE_SENT: '/sending_message.mp3',
};

const MUSIC_PATH = '/geoffharvey-solve-the-riddle-140001.mp3';

// --- AUDIO ENGINE CLASS ---
// --- SFX CATEGORIZATION FOR PERFORMANCE ---
const CRITICAL_SFX = ['CLICK', 'POP', 'TAB', 'START_GAME', 'BACK', 'SETTINGS_OPEN'];

class SoundEngine {
  constructor() {
    this.context = null;
    this.buffers = {};
    this.loadingBuffers = {}; // Track in-progress loads to avoid duplicates
    this.initialized = false;
    this.masterVolume = 0.20; // 20% Default as requested
    this.musicVolume = 0.10;
    
    // Music management (Streaming)
    this.musicAudioElement = null;
    this.musicMediaSource = null;
    this.musicGain = null;
    this.isStoppedByPolicy = false; // Flag to handle strict BGM suppression
    
    // Matchmaking Loop Management
    this.searchingNodes = [];
    this.searchingGain = null;
  }

  /**
   * Initialize AudioContext on first user interaction
   */
  async init() {
    if (this.initialized) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      
      // 1. Setup Streaming Music (HTML5 Audio) - Bypassing AudioContext for maximum stability
      if (!this.musicAudioElement) {
        this.musicAudioElement = new Audio(MUSIC_PATH);
        this.musicAudioElement.loop = true;
        this.musicAudioElement.crossOrigin = "anonymous";
        this.musicAudioElement.volume = this.musicVolume;
      }

      // 2. Pre-fetch ONLY CRITICAL SFX (Ultra Fast Initial Load)
      const loadPromises = CRITICAL_SFX.map(async (key) => {
        const path = SFX_PATHS[key];
        if (path) {
          const buffer = await this.loadBuffer(path);
          if (buffer) this.buffers[key] = buffer;
        }
      });
      
      Promise.all(loadPromises).then(() => {
        console.log("🔊 [AudioEngine] Critical SFX Loaded");
      });

      // 4. Start Streaming Music Immediately
      this.startMusic();
    } catch (e) {
      console.warn("AudioContext failed to initialize:", e);
    }
  }

  /**
   * Load and decode audio file into a buffer (For SFX)
   */
  async loadBuffer(url) {
    if (this.loadingBuffers[url]) return this.loadingBuffers[url];
    
    this.loadingBuffers[url] = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const decodedData = await this.context.decodeAudioData(arrayBuffer);
        return decodedData;
      } catch (e) {
        console.error(`❌ [AudioEngine] Failed to load SFX: ${url}`, e);
        return null;
      } finally {
        delete this.loadingBuffers[url];
      }
    })();
    
    return this.loadingBuffers[url];
  }

  /**
   * Start Looping Music (Streaming)
   */
  startMusic() {
    if (!this.musicAudioElement || this.isStoppedByPolicy) return;

    this.musicAudioElement.play().then(() => {
      console.log("🎵 [AudioEngine] Music Streaming Started (Stable Mode)");
    }).catch(e => {
      if (e.name === 'NotAllowedError') {
        console.warn("🎵 [AudioEngine] Autoplay blocked, waiting for interaction.");
      } else {
        console.warn("🎵 [AudioEngine] Music playback error:", e);
      }
    });
  }

  /**
   * Force resume AudioContext (iOS Fix)
   */
  async forceResume() {
    if (!this.initialized) await this.init();
    if (this.context && this.context.state === 'suspended') {
      try {
        await this.context.resume();
        console.log("🔊 [AudioEngine] Context Resumed Successfully");
      } catch (e) {
        console.warn("🔊 [AudioEngine] Context Resume Failed:", e);
      }
    }
  }

  /**
   * STOP MUSIC (Strict Lobby Only Policy)
   * This MUST be called as soon as the user leaves the 'lobby' view.
   */
  stopMusic() {
    if (this.musicAudioElement) {
      this.musicAudioElement.pause();
      console.log("🎵 [AudioEngine] Strict Policy: Music Streaming Paused (for Gameplay)");
    }
  }

  /**
   * Set Master SFX Volume
   */
  setSfxVolume(volume) {
    this.masterVolume = volume;
    console.log(`🔊 [AudioEngine] Master SFX Volume set to: ${Math.round(volume * 100)}%`);
  }

  /**
   * Set Music Volume
   */
  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.musicAudioElement) {
      // Direct volume control is more stable and bypasses CPU-heavy AudioContext processing
      this.musicAudioElement.volume = volume;
    }
  }

  /**
   * Play a sound with polyphony (Supports Lazy Loading)
   */
  async play(key, options = {}) {
    if (!this.initialized) return;

    // LAZY LOADING: If buffer is missing, load it now
    if (!this.buffers[key]) {
      const path = SFX_PATHS[key];
      if (!path) return;
      
      console.log(`🔊 [AudioEngine] Lazy loading SFX: ${key}`);
      const buffer = await this.loadBuffer(path);
      if (buffer) {
        this.buffers[key] = buffer;
      } else {
        return;
      }
    }

    if (this.context.state === 'suspended') {
      try { await this.context.resume(); } catch (_e) { /* Audio context resume failed or was blocked */ }
    }

    const { volume = 1.0, pitchRandomization = 0, detune = 0 } = options;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[key];

    const gainNode = this.context.createGain();
    
    let baseVolume = volume;
    if (key === 'CLICK') baseVolume *= 0.3;
    if (key === 'POP') baseVolume *= 0.45;
    if (key === 'ALERT') baseVolume *= 0.8;
    if (key === 'NOTIFICATION') baseVolume *= 0.9;
    if (key === 'START_GAME') baseVolume *= 0.2;
    if (key === 'TAB') baseVolume *= 0.6;
    if (key === 'BUBBLE_POP') baseVolume *= 0.8;
    if (key === 'SWORD_COMBO') baseVolume *= 0.6;
    if (key === 'SWORD_SLASH') baseVolume *= 0.5;
    if (key === 'WHOOSH') baseVolume *= 1.0;
    
    gainNode.gain.value = baseVolume * this.masterVolume;

    if (pitchRandomization > 0) {
      const randomDetune = (Math.random() * 2 - 1) * pitchRandomization;
      source.detune.value = detune + randomDetune;
    } else if (detune !== 0) {
      source.detune.value = detune;
    }

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(0);
  }

  /**
   * Start Multiplayer Searching sound (MP3 File Loop)
   */
  startSearchingSfx() {
    if (!this.initialized) return;

    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }

    // Initialize the element if it doesn't exist
    if (!this.searchingAudioElement) {
      this.searchingAudioElement = new Audio('/multiplayer_mode_searching.mp3');
      this.searchingAudioElement.loop = true;
      this.searchingAudioElement.crossOrigin = "anonymous";
      
      // Pipe HTML5 Audio into Web Audio API for gain control
      this.searchingMediaSource = this.context.createMediaElementSource(this.searchingAudioElement);
      this.searchingGain = this.context.createGain();
      this.searchingMediaSource.connect(this.searchingGain);
      this.searchingGain.connect(this.context.destination);
    }

    // Set default volume for this track to 0.20 (increased by 30% from 0.15 as requested)
    // We scale it by masterVolume to respect overall SFX settings
    const targetVolume = 0.20 * this.masterVolume;
    
    this.searchingGain.gain.cancelScheduledValues(this.context.currentTime);
    this.searchingGain.gain.setValueAtTime(this.searchingGain.gain.value, this.context.currentTime);
    this.searchingGain.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + 0.5);

    this.searchingAudioElement.play().then(() => {
      console.log("🔊 [AudioEngine] Searching SFX Started (Looping)");
    }).catch(e => {
      if (e.name === 'NotAllowedError') {
        console.warn("🔊 [AudioEngine] Autoplay blocked, waiting for interaction.");
      } else {
        console.warn("🔊 [AudioEngine] Searching SFX error:", e);
      }
    });
  }

  /**
   * Stop searching sound with smooth fade
   */
  stopSearchingSfx(fade = true) {
    if (!this.searchingAudioElement) return;

    const stopAction = () => {
      this.searchingAudioElement.pause();
      this.searchingAudioElement.currentTime = 0;
      console.log("🔊 [AudioEngine] Searching SFX Stopped");
    };

    if (fade && this.searchingGain) {
      this.searchingGain.gain.cancelScheduledValues(this.context.currentTime);
      this.searchingGain.gain.setValueAtTime(this.searchingGain.gain.value, this.context.currentTime);
      this.searchingGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.4);
      setTimeout(stopAction, 500);
    } else {
      stopAction();
    }
  }
}

// Singleton Instance
const engine = new SoundEngine();

// Initialize on user activity
// 1. INVISIBLE UNLOCK: Attach a one-time global interaction listener
if (typeof window !== "undefined") {
  const unlockAudio = async () => {
    console.log("🔊 [AudioEngine] Interaction detected, unlocking AudioContext...");
    
    // Initialize if not already done
    if (!engine.initialized) {
      await engine.init();
    }
    
    // Resume context if suspended (Chrome Autoplay Policy)
    if (engine.context && engine.context.state === 'suspended') {
      try {
        await engine.context.resume();
        console.log("🔊 [AudioEngine] AudioContext successfully resumed.");
      } catch (err) {
        console.warn("🔊 [AudioEngine] Failed to resume AudioContext:", err);
      }
    }
    
    // Start music if it should be playing
    engine.startMusic();
    
    // Cleanup: Remove listeners immediately after first success
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('mousedown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
  window.addEventListener('mousedown', unlockAudio);
}

/**
 * Public API
 */
export const initAudio = () => engine.init();
export const startBackgroundMusic = () => {
  engine.isStoppedByPolicy = false;
  engine.startMusic();
};
export const stopBackgroundMusic = () => {
  engine.isStoppedByPolicy = true;
  engine.stopMusic();
};
export const setBackgroundMusicVolume = (volume) => engine.setMusicVolume(volume);
export const setSfxVolume = (volume) => engine.setSfxVolume(volume);

export const playKeyClickSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('CLICK', { pitchRandomization: 100 }); 
};

export const playPopSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('POP', { pitchRandomization: 50 });
};

export const playNotificationSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('NOTIFICATION');
};

export const playSettingsOpenSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('SETTINGS_OPEN');
};

export const playSettingsCloseSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('SETTINGS_CLOSE');
};

export const playAlertSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('ALERT');
};

export const playStartGameSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('START_GAME');
};

export const playBackSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('BACK');
};

export const playSaveSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('SAVE');
};

export const playTabSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('TAB');
};

export const playNotifSfx = playNotificationSfx;
export const playMessageSfx = playNotificationSfx;
export const playMessageSentSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('MESSAGE_SENT');
};
export const playGameStartSfx = playStartGameSfx;
export const playSuccessSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('VICTORY');
};
export const playVictorySfx = playSuccessSfx;
export const playCoinSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('EARNING');
};

export const playRewardSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('EARNING');
};

export const playPurchaseSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('PURCHASE');
};

export const playBoosterSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('BOOSTER');
};

export const playDailyOpenSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('DAILY_OPEN');
};

export const playDailyClaimSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('DAILY_CLAIM');
};

export const playBubblePopSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('BUBBLE_POP', { pitchRandomization: 10 });
};
export const playSwordComboSfx = () => engine.play('SWORD_COMBO');
export const playSwordSlashSfx = () => engine.play('SWORD_SLASH', { pitchRandomization: 50 });
export const playWhooshSfx = () => engine.play('WHOOSH');
export const startSearchingSfx = () => engine.startSearchingSfx();
export const stopSearchingSfx = (fade = true) => engine.stopSearchingSfx(fade);
export const forceResumeAudio = () => engine.forceResume();
