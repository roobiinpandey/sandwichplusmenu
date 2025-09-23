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
      { name: 'notification', path: '/sounds/notification.mp3' },
      { name: 'order-alert', path: '/sounds/order-alert.mp3' },
      { name: 'ding', path: '/sounds/ding.mp3' }
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
    if (!this.isEnabled) return;
    
    try {
      // Try to play the specific sound file first
      if (this.notificationSounds[soundName]) {
        const audio = this.notificationSounds[soundName];
        audio.currentTime = 0; // Reset to beginning
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
        }
        return;
      }
      
      // Fallback: create beep sound with Web Audio API
      this.createBeepSound();
      
    } catch (error) {
      console.warn('Failed to play notification:', error);
      
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
      
    } catch (error) {
      console.warn('Failed to create beep sound:', error);
    }
  }
  
  // Play order received notification
  playOrderAlert() {
    this.playNotification('order-alert');
    
    // Optional: repeat the sound 2 more times with delays for emphasis
    setTimeout(() => this.playNotification('ding'), 600);
    setTimeout(() => this.playNotification('ding'), 1200);
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
