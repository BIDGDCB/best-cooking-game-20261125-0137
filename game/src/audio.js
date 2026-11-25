// All sound is synthesised with WebAudio: no audio files, nothing fetched.
// Every call is guarded so the game still runs where audio is unavailable.
let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}
export function isMuted() {
  return muted;
}

function audioContext() {
  if (typeof window === 'undefined') return null;
  try {
    if (!context) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      context = new AC();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    /* sound is decoration; never break the game */
  }
}

function noiseBurst(dur, vol, freq) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  try {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start();
  } catch {
    /* sound is decoration */
  }
}

export const sfx = {
  pickup() { tone(520, 0.07, 'sine', 0.12); },
  place() { tone(340, 0.08, 'triangle', 0.14); noiseBurst(0.05, 0.08, 900); },
  chop() { noiseBurst(0.07, 0.22, 1400); tone(180, 0.06, 'square', 0.06); },
  chopped() { tone(660, 0.08, 'sine', 0.14); tone(880, 0.1, 'sine', 0.12, 0.07); },
  sizzle() { noiseBurst(0.35, 0.1, 3200); },
  cooked() { tone(740, 0.09, 'sine', 0.14); tone(990, 0.12, 'sine', 0.12, 0.08); },
  burnt() { tone(220, 0.25, 'sawtooth', 0.1, 0, 110); },
  serve() { tone(880, 0.1, 'sine', 0.16); tone(1174, 0.14, 'sine', 0.16, 0.09); tone(1568, 0.2, 'sine', 0.14, 0.18); },
  error() { tone(160, 0.18, 'sawtooth', 0.12, 0, 120); },
  tick() { tone(980, 0.05, 'square', 0.07); },
  order() { tone(587, 0.09, 'triangle', 0.12); tone(784, 0.12, 'triangle', 0.12, 0.08); },
  click() { tone(700, 0.05, 'sine', 0.1); },
  star() { tone(1046, 0.12, 'sine', 0.15); tone(1318, 0.16, 'sine', 0.15, 0.1); },
};
