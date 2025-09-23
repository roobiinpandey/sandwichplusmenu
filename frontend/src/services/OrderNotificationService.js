// Sound files for order notifications - these will be placed in public/sounds/

// Notification sound sources (you can add your own sound files):
// 1. notification.mp3 - General notification sound
// 2. order-alert.mp3 - Specific order alert sound  
// 3. ding.mp3 - Simple ding sound

// For now, I'll create a beep sound using Web Audio API as fallback
export class OrderNotificationService {
  constructor() {
    this.audioContext = null;
    this.notificationSounds = {};
    this.isEnabled = true;
    
    // Initialize audio context
    this.initAudio();
    
    // Load notification sounds
    this.loadSounds();
    
    // Create backup audio elements with data URLs
    this.createBackupSounds();
  }
  
  initAudio() {
    try {
      // Create audio context (with user interaction requirement handling)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }
  
  async loadSounds() {
    const soundFiles = [
      { name: 'notification', path: '/sounds/notification.wav' },
      { name: 'order-alert', path: '/sounds/order-alert.wav' },
      { name: 'ding', path: '/sounds/ding.wav' }
    ];
    
    for (const sound of soundFiles) {
      try {
        const audio = new Audio(sound.path);
        audio.preload = 'auto';
        audio.volume = 0.7; // Set volume to 70%
        this.notificationSounds[sound.name] = audio;
        
        // Handle loading errors gracefully
        audio.onerror = () => {
          console.warn(`Failed to load sound: ${sound.path}`);
          delete this.notificationSounds[sound.name];
        };
      } catch (error) {
        console.warn(`Error loading sound ${sound.name}:`, error);
      }
    }
  }
  
  // Create backup sounds using data URLs (always available)
  createBackupSounds() {
    // Simple beep as data URL - this will work even if external files fail
    const generateTone = (freq, duration) => {
      const sampleRate = 8000; // Lower sample rate for smaller data
      const samples = sampleRate * duration;
      const wav = new Uint8Array(44 + samples * 2);
      
      // WAV header
      const view = new DataView(wav.buffer);
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + samples * 2, true);
      view.setUint32(8, 0x57415645, false); // "WAVE"
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, samples * 2, true);
      
      // Generate tone
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 3);
        const pcm = Math.max(-32768, Math.min(32767, sample * 32767));
        view.setInt16(44 + i * 2, pcm, true);
      }
      
      const blob = new Blob([wav], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    };
    
    try {
      // Create backup audio with generated tones
      this.notificationSounds['backup-beep'] = new Audio(generateTone(800, 0.5));
      this.notificationSounds['backup-alert'] = new Audio(generateTone(1000, 0.3));
      console.log('[NOTIFICATION] Backup sounds created successfully');
    } catch (error) {
      console.warn('[NOTIFICATION] Failed to create backup sounds:', error);
    }
  }
  
  // Enable notifications (important for webview/tablet environments)
  enable() {
    this.isEnabled = true;
    
    // Resume audio context if suspended (required by browsers)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  disable() {
    this.isEnabled = false;
  }
  
  // Play notification sound
  async playNotification(soundName = 'notification') {
    console.log(`[NOTIFICATION] Playing sound: ${soundName}, enabled: ${this.isEnabled}`);
    
    if (!this.isEnabled) {
      console.log('[NOTIFICATION] Notifications disabled, skipping');
      return;
    }
    
    try {
      // Try to play the specific sound file first
      if (this.notificationSounds[soundName]) {
        console.log(`[NOTIFICATION] Playing audio file: ${soundName}`);
        const audio = this.notificationSounds[soundName];
        audio.currentTime = 0; // Reset to beginning
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log(`[NOTIFICATION] Successfully played: ${soundName}`);
        }
        return;
      }
      
      console.log(`[NOTIFICATION] Audio file not available for ${soundName}, trying backup sounds`);
      
      // Try backup sounds first
      if (this.notificationSounds['backup-beep']) {
        console.log('[NOTIFICATION] Playing backup beep sound');
        const backupAudio = this.notificationSounds['backup-beep'];
        backupAudio.currentTime = 0;
        const backupPromise = backupAudio.play();
        if (backupPromise !== undefined) {
          await backupPromise;
          console.log('[NOTIFICATION] Backup sound played successfully');
          return;
        }
      }
      
      // Fallback: create beep sound with Web Audio API
      this.createBeepSound();
      
    } catch (error) {
      console.warn('Failed to play notification:', error);
      
      // Additional fallback: try different Web Audio approach
      this.createAlternateBeep();
      
      // Final fallback: try browser notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: 'A new order has been placed.',
          icon: '/favicon.ico'
        });
      }
    }
  }
  
  // Create programmatic beep sound as fallback
  createBeepSound() {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.5);
      
      console.log('[NOTIFICATION] Created Web Audio beep');
    } catch (error) {
      console.warn('Failed to create beep sound:', error);
    }
  }
  
  // Alternative beep sound method for better tablet compatibility
  createAlternateBeep() {
    try {
      // Method 1: Try creating a data URL audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a more prominent notification sound
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.8);
      
      console.log('[NOTIFICATION] Created alternate beep sound');
    } catch (error) {
      console.warn('Alternate beep failed:', error);
    }
  }
  
  // Tablet-specific notification methods
  triggerTabletNotification() {
    console.log('[NOTIFICATION] Triggering tablet-specific notifications');
    
    // Method 1: Vibration (works on mobile devices)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]); // Pattern: vibrate, pause, vibrate...
      console.log('[NOTIFICATION] Vibration triggered');
    }
    
    // Method 2: Screen wake lock to ensure visibility
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(() => {
        console.log('[NOTIFICATION] Screen wake lock acquired');
        // Release after 5 seconds
        setTimeout(() => {
          if (document.wakeLock) {
            document.wakeLock.release();
          }
        }, 5000);
      }).catch(err => {
        console.log('[NOTIFICATION] Wake lock failed:', err);
      });
    }
    
    // Method 3: Browser/System notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const notification = new Notification('🍽️ New Order Received!', {
          body: 'A new order has been placed and needs attention.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'new-order', // Replace previous notifications
          requireInteraction: true, // Keep notification visible
          vibrate: [200, 100, 200],
          actions: [
            { action: 'view', title: 'View Order', icon: '/favicon.ico' }
          ]
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);
        
        console.log('[NOTIFICATION] System notification created');
      } else {
        console.log('[NOTIFICATION] Notification permission not granted');
      }
    }
    
    // Method 4: Document title flash for attention
    this.flashDocumentTitle();
    
    // Method 5: Full screen flash
    this.flashScreen();
  }
  
  // Flash document title to get attention
  flashDocumentTitle() {
    const originalTitle = document.title;
    let flashCount = 0;
    
    const flashInterval = setInterval(() => {
      document.title = flashCount % 2 === 0 ? '🔔 NEW ORDER!' : originalTitle;
      flashCount++;
      
      if (flashCount >= 10) { // Flash 5 times
        document.title = originalTitle;
        clearInterval(flashInterval);
      }
    }, 500);
    
    console.log('[NOTIFICATION] Document title flash started');
  }
  
  // Flash screen for visual attention
  flashScreen() {
    // Create a full-screen flash overlay
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 0, 0, 0.3);
      z-index: 9999;
      pointer-events: none;
      animation: flashAnimation 0.2s ease-in-out 3;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flashAnimation {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(flash);
    
    // Remove after animation
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 1000);
    
    console.log('[NOTIFICATION] Screen flash triggered');
  }
  
  // Play order received notification with full tablet support
  playOrderAlert() {
    console.log('[NOTIFICATION] Playing full order alert with tablet support');
    
    // Audio notifications
    this.playNotification('order-alert');
    
    // Optional: repeat the sound 2 more times with delays for emphasis
    setTimeout(() => this.playNotification('ding'), 600);
    setTimeout(() => this.playNotification('ding'), 1200);
    
    // Tablet-specific notifications (vibration, system notification, visual cues)
    this.triggerTabletNotification();
    
    // Additional audio attempts for tablets
    setTimeout(() => {
      this.createAlternateBeep();
    }, 300);
    
    setTimeout(() => {
      this.createBeepSound();
    }, 900);
  }
  
  // Request notification permission for web browsers
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Create singleton instance
export const notificationService = new OrderNotificationService();

// Auto-enable on user interaction (required for audio to work)
document.addEventListener('click', () => {
  notificationService.enable();
}, { once: true });

document.addEventListener('touchstart', () => {
  notificationService.enable();
}, { once: true });
