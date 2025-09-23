// Script to generate working WAV files for notifications
// Run this in browser console to create real sound files

function createWaveFile(frequencies, duration, filename) {
  const sampleRate = 44100;
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Generate audio samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // Mix frequencies
    for (const freq of frequencies) {
      const amplitude = 0.3 / frequencies.length;
      sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
    }
    
    // Apply envelope (fade out)
    const envelope = Math.exp(-t * 2);
    sample *= envelope;
    
    // Convert to 16-bit PCM
    const pcm = Math.max(-1, Math.min(1, sample)) * 32767;
    view.setInt16(offset, pcm, true);
    offset += 2;
  }
  
  // Download file
  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Create notification sounds
console.log('Creating notification sounds...');

// 1. Pleasant notification sound (two-tone)
createWaveFile([523.25, 659.25], 1.0, 'notification.wav');

// 2. Urgent order alert (rapid beeps)
createWaveFile([880], 1.5, 'order-alert.wav');

// 3. Simple ding
createWaveFile([1046.5], 0.8, 'ding.wav');

console.log('Sound files generated! Replace the empty .wav files in /sounds/ directory.');
