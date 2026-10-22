export class ClickSounds {
  constructor(muted = false) {
    this.muted = muted;
    this.context = null;
    this.lastPlayedAt = 0;
    this.unavailable = false;
  }

  async play() {
    if (this.muted || this.unavailable || performance.now() - this.lastPlayedAt < 60) return;
    this.lastPlayedAt = performance.now();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { this.unavailable = true; return; }
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
      if (this.context.state !== 'running' || this.muted) return;

      const start = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1150, start);
      oscillator.frequency.exponentialRampToValueAtTime(430, start + .025);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.035, start + .002);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .035);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start);
      oscillator.stop(start + .04);
    } catch (error) {
      this.unavailable = true;
      console.warn('Interface sounds are unavailable; visual controls remain usable.', error.name);
    }
  }
}
