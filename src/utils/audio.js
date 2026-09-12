import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { App } from '@capacitor/app';
/**
 * Premium Game Audio Engine (Web Audio API)
 * Optimized for low-latency, polyphony, and high-performance streaming.
 */

const SFX_PATHS = {
  CLICK: '/click.mp3',
  POP: '/pop.mp3',
  NOTIFICATION: '/ui_sfx_notification.wav',
  SETTINGS_OPEN: '/open_setting.mp3',
  SETTINGS_CLOSE: '/close_setting.mp3',
  ALERT: '/ui_sfx_alert.wav',
  START_GAME: '/ui_sfx_start_button.wav',
  BACK: '/ui_sfx_menu_close.wav',
  SAVE: '/minimal-pop-click-save.ui.wav',
  TAB: '/Puzzle-game-tile-swap-912.wav',
  VICTORY: '/victory.mp3',
  DAILY_OPEN: '/Video-game-reward-chest-opening-gentle-950.wav',
  DAILY_CLAIM: '/coin-jingle-trio-89078.wav', 
  BUBBLE_POP: '/bubble-poP.wav',
  PURCHASE: '/coin-drop-229314.wav',
  EARNING: '/coin-jingle-trio-89078.wav',
  WHEEL_COIN: '/wheel_ coin_sound.mp3',
  WHEEL_SPIN: '/Casino-game-fortune-wheel-spin-2-252.wav',
  CHEST_OPEN: '/Chest-open-reward-888.wav',
  CHEST_CREAK: '/old-wooden-floor-creaking.mp3',
  REWARD_POP: '/Chest-open-fail-reward-191.wav',
  MAGNET_CLAIM: '/dizzy-ellectric-bolt-spell_S2n2FK1z.mp3',
  BOOSTER: '/hit-shell-01-266294.wav',
  SWORD_COMBO: '/freesound_crunchpixstudio-rpg-sword-attack-combo-34-388950.mp3',
  SWORD_SLASH: '/gargamel10-sword-slashing-game-sound-effect-2-379229.mp3',
  WHOOSH: '/lordsonny-whoosh-cinematic-161021.mp3',
  MESSAGE_SENT: '/sending_message.mp3',
  MESSAGE_RECEIVED: '/Privet_message.wav',
  RIGHT_LETTER: '/rightletter.mp3',
  WRONG_PLACE: '/right-letter-wrong-place_GwCJf57j.mp3',
  DEFEAT: '/defeat.mp3',
  NOBERA: '/Saratay_sound.mp3',
  PALAWAN: '/Pahlawan_sound.mp3',
  EXPERT: '/Shareza_sound.wav',
  MAMOSTA: '/mamosta_sound.mp3',
  SHANAZI_KURDISTAN: '/Sanazya_Kurdistane.mp3',
  SHANAZI_JIHANI: '/Shanazya_cihane.mp3',
  HEARTBEAT: '/heartbeat.mp3',
  INVITE: '/Havrky_invite.mp3',
};

const MUSIC_PATH = '/geoffharvey-solve-the-riddle-140001.mp3';

// --- AUDIO ENGINE CLASS ---
// --- SFX CATEGORIZATION FOR PERFORMANCE ---
const CRITICAL_SFX = ['CLICK', 'POP', 'TAB', 'START_GAME', 'BACK', 'SETTINGS_OPEN'];

class SoundEngine {

  getBaseVolume(key, initialVolume = 1.0) {
    let baseVolume = initialVolume;
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
    if (key === 'RIGHT_LETTER') baseVolume *= 0.8;
    if (key === 'WRONG_PLACE') baseVolume *= 2.5;
    if (key === 'DEFEAT') baseVolume *= 1.0;
    if (key === 'NOBERA') baseVolume *= 1.0;
    if (key === 'PALAWAN') baseVolume *= 1.0;
    if (key === 'EXPERT') baseVolume *= 1.0;
    if (key === 'MAMOSTA') baseVolume *= 1.0;
    if (key === 'SHANAZI_KURDISTAN') baseVolume *= 1.0;
    if (key === 'SHANAZI_JIHANI') baseVolume *= 1.0;
    if (key === 'HEARTBEAT') baseVolume *= 1.0;
    if (key === 'MESSAGE_RECEIVED') baseVolume *= 0.9;
    if (key === 'WHEEL_COIN') baseVolume *= 1.4;
    if (key === 'REWARD_POP') baseVolume *= 2.0;
    if (key === 'CHEST_CREAK') baseVolume *= 8.0;
    return baseVolume;
  }

  constructor() {
    this.context = null;
    this.buffers = {};
    this.loadingBuffers = {}; // Track in-progress loads to avoid duplicates
    this.initialized = false;
    this.masterVolume = 0.20; // 20% Default as requested
    this.musicVolume = 0.005; // Decreased further to be very quiet
    
    // Music management (Streaming)
    this.musicAudioElement = null;
    this.musicMediaSource = null;
    this.musicGain = null;
    this.isStoppedByPolicy = false; // Flag to handle strict BGM suppression
    
    // Matchmaking Loop Management
    this.searchingNodes = [];
    this.searchingGain = null;
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize AudioContext on first user interaction
   */
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Handle background/foreground music pausing
    const handleBackground = () => {
      if (this.isNative) {
        NativeAudio.stop({ assetId: 'BGM' }).catch(() => {});
      } else if (this.musicAudioElement) {
        this.musicAudioElement.pause();
      }
    };

    const handleForeground = () => {
      if (!this.isStoppedByPolicy) {
        if (this.isNative) {
          NativeAudio.loop({ assetId: 'BGM' }).catch(() => {});
        } else if (this.musicAudioElement) {
          this.musicAudioElement.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'hidden') handleBackground();
      else handleForeground();
    });

    try {
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) handleBackground();
        else handleForeground();
      });
    } catch (_e) {
      console.warn("Capacitor App plugin not available for state listener");
    }

    if (this.isNative) {
       console.log("🔊 [AudioEngine] Native Mode Detected");
       try {
         await NativeAudio.preload({ assetId: 'BGM', assetPath: 'public' + MUSIC_PATH, audioChannelNum: 1, isUrl: false });
         await NativeAudio.preload({ assetId: 'SEARCHING', assetPath: 'public/multiplayer_mode_searching.mp3', audioChannelNum: 1, isUrl: false });
         
         await Promise.all(CRITICAL_SFX.map(async (key) => {
           const path = SFX_PATHS[key];
           if (path) {
              try {
                await NativeAudio.preload({ assetId: key, assetPath: 'public' + path, audioChannelNum: 1, isUrl: false });
              } catch(_e) { /* ignore */ }
            }
         }));
         console.log("🔊 [AudioEngine] Native Critical SFX Loaded");
       } catch (err) {
         console.warn("NativeAudio init failed, falling back to Web Audio", err);
         this.isNative = false; 
       }
    }

    if (!this.isNative) {
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // 1. Setup Streaming Music (HTML5 Audio) - Routed through AudioContext for mobile volume control
        if (!this.musicAudioElement) {
          this.musicAudioElement = new Audio(MUSIC_PATH);
          this.musicAudioElement.loop = true;
          this.musicAudioElement.crossOrigin = "anonymous";
          this.musicAudioElement.volume = this.musicVolume;

          try {
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.context.destination);
            
            this.musicMediaSource = this.context.createMediaElementSource(this.musicAudioElement);
            this.musicMediaSource.connect(this.musicGain);
            
            this.musicAudioElement.volume = 1.0;
          } catch (err) {
            console.warn("Failed to route music through GainNode (Mobile volume might fail):", err);
          }
        }

        // 2. Pre-fetch ONLY CRITICAL SFX (Ultra Fast Initial Load)
        const loadPromises = CRITICAL_SFX.map(async (key) => {
          const path = SFX_PATHS[key];
          if (path) {
            const buffer = await this.loadBuffer(path);
            if (buffer) {
              this.buffers[key] = buffer;
            } else {
              this.buffers[key] = 'fallback';
            }
          }
        });
        
        Promise.all(loadPromises).then(() => {
          console.log("🔊 [AudioEngine] Critical SFX Loaded");
        });

      } catch (e) {
        console.warn("AudioContext failed to initialize:", e);
      }
    }

    // 4. Start Streaming Music Immediately
    this.startMusic();
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
        if (!url.includes('open_setting') && !url.includes('close_setting')) {
          console.error(`❌ [AudioEngine] Failed to load SFX: ${url}`, e);
        }
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
    if (this.isStoppedByPolicy) return;
    if (this.isNative) {
       try {
         NativeAudio.setVolume({ assetId: 'BGM', volume: this.musicVolume });
         NativeAudio.loop({ assetId: 'BGM' }).catch(()=>{});
         console.log("🎵 [AudioEngine] Native Music Streaming Started");
       } catch(e) { console.warn(e); }
       return;
    }
    if (!this.musicAudioElement) return;

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
    if (this.isNative) {
      NativeAudio.stop({ assetId: 'BGM' }).catch(()=>{});
      console.log("🎵 [AudioEngine] Native Music Streaming Paused");
      return;
    }
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
    const scaledVolume = volume * 0.35;
    this.musicVolume = scaledVolume;
    
    if (this.isNative) {
       NativeAudio.setVolume({ assetId: 'BGM', volume: scaledVolume }).catch(()=>{});
       return;
    }
    
    if (this.musicGain && this.context) {
      // If GainNode is active, it handles the volume for ALL platforms equally.
      this.musicGain.gain.setTargetAtTime(scaledVolume, this.context.currentTime, 0.1);
    } else if (this.musicAudioElement) {
      // Fallback only if Web Audio API routing failed
      this.musicAudioElement.volume = scaledVolume;
    }
  }

  /**
   * Play a sound with polyphony (Supports Lazy Loading)
   */
  async play(key, options = {}) {
    if (!this.initialized) return;

    if (this.isNative) {
      if (!CRITICAL_SFX.includes(key) && !this.buffers[key]) {
        const path = SFX_PATHS[key];
        if (path) {
          try {
             await NativeAudio.preload({ assetId: key, assetPath: 'public' + path, audioChannelNum: 1, isUrl: false });
             this.buffers[key] = true;
          } catch(_e) { /* ignore */ }
        }
      }
      const baseVolume = this.getBaseVolume(key, options.volume || 1.0);
      const finalVolume = Math.min(1.0, Math.max(0.0, baseVolume * this.masterVolume));
      try {
        await NativeAudio.setVolume({ assetId: key, volume: finalVolume });
        await NativeAudio.play({ assetId: key });
      } catch (e) { console.warn("NativeAudio play failed:", e); }
      return;
    }


    // LAZY LOADING: If buffer is missing, load it now
    if (!this.buffers[key]) {
      const path = SFX_PATHS[key];
      if (!path) return;
      
      console.log(`🔊 [AudioEngine] Lazy loading SFX: ${key}`);
      const buffer = await this.loadBuffer(path);
      if (buffer) {
        this.buffers[key] = buffer;
      } else {
        this.buffers[key] = 'fallback';
      }
    }

    if (this.buffers[key] === 'fallback') {
      console.warn(`[AudioEngine] Using HTML5 Audio fallback for ${key}`);
      const path = SFX_PATHS[key];
      const audio = new Audio(path);
      let baseVolume = this.getBaseVolume(key, options.volume || 1.0);
      audio.volume = Math.min(1.0, Math.max(0.0, baseVolume * this.masterVolume));
      audio.play().catch(e => console.error("HTML5 Audio fallback failed", e));
      return;
    }

    if (this.context.state === 'suspended') {
      try { await this.context.resume(); } catch (_e) { /* Audio context resume failed or was blocked */ }
    }

    const { volume = 1.0, pitchRandomization = 0, detune = 0, duration } = options;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[key];

    const gainNode = this.context.createGain();
    
    let baseVolume = this.getBaseVolume(key, volume);
    // Boosted to 8.0 to make it louder
    
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

    if (duration) {
      // Fade out over the last 0.1s before stopping for a smooth cut
      gainNode.gain.setValueAtTime(baseVolume * this.masterVolume, this.context.currentTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0.01, this.context.currentTime + duration);
      source.stop(this.context.currentTime + duration);
    }
  }

  /**
   * Start Multiplayer Searching sound (MP3 File Loop)
   */
  startSearchingSfx() {
    if (!this.initialized) return;
    
    if (this.isNative) {
       const targetVolume = 0.20 * this.masterVolume;
       try {
         NativeAudio.setVolume({ assetId: 'SEARCHING', volume: targetVolume }).catch(()=>{});
         NativeAudio.loop({ assetId: 'SEARCHING' }).catch(()=>{});
       } catch(_e) { /* ignore */ }
       return;
    }

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
    if (this.isNative) {
      NativeAudio.stop({ assetId: 'SEARCHING' }).catch(()=>{});
      return;
    }
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

export const playInviteSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('INVITE');
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

export const playHeartbeatSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('HEARTBEAT');
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
export const playMessageSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('MESSAGE_RECEIVED');
};
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
export const playChestOpenSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('CHEST_OPEN');
};
export const playChestCreakSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('CHEST_CREAK');
};
export const playDefeatSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('DEFEAT');
};
export const playCoinSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('WHEEL_COIN'); // Exact same sound every time without pitch shift
};

export const playMagnetSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('MAGNET_CLAIM');
};

export const playWheelSpinSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('WHEEL_SPIN');
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
  engine.play('DAILY_OPEN', { duration: 1.2 });
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
export const playRewardPopSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('REWARD_POP');
};
export const playWhooshSfx = () => engine.play('WHOOSH');
export const startSearchingSfx = () => engine.startSearchingSfx();
export const stopSearchingSfx = (fade = true) => engine.stopSearchingSfx(fade);
export const forceResumeAudio = () => engine.forceResume();

/**
 * Play sound for correct letter in right position (Green)
 */
export const playRightLetterSfx = (enabled = true, volume = 1.0) => {
  if (!enabled) return;
  engine.play('RIGHT_LETTER', { volume, pitchRandomization: 10 });
};

/**
 * Play sound for correct letter in wrong position (Yellow)
 */
export const playWrongPlaceSfx = (enabled = true, volume = 1.0) => {
  if (!enabled) return;
  engine.play('WRONG_PLACE', { volume, pitchRandomization: 10 });
};

// --- NEW MEDAL AND ALERT SOUNDS ---
export const playNoberaSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('NOBERA');
};

export const playPalawanSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('PALAWAN');
};

export const playExpertSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('EXPERT');
};

export const playMamostaSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('MAMOSTA');
};

export const playShanaziKurdistanSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('SHANAZI_KURDISTAN');
};

export const playShanaziJihaniSfx = (enabled = true) => {
  if (!enabled) return;
  engine.play('SHANAZI_JIHANI');
};
