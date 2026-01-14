// Sound effects system with Web Audio API

const SOUNDS = {
  correct: { frequency: 880, duration: 150, type: "sine" as OscillatorType },
  incorrect: { frequency: 220, duration: 200, type: "square" as OscillatorType },
  click: { frequency: 600, duration: 50, type: "sine" as OscillatorType },
  navigate: { frequency: 440, duration: 80, type: "triangle" as OscillatorType },
  complete: { frequency: 660, duration: 100, type: "sine" as OscillatorType, sequence: [660, 880, 1100] },
} as const;

type SoundName = keyof typeof SOUNDS;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playSound(name: SoundName): void {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    const sound = SOUNDS[name];

    if ("sequence" in sound && sound.sequence) {
      // Play sequence of notes
      sound.sequence.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = sound.type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.15);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = sound.type;
      osc.frequency.value = sound.frequency;

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + sound.duration / 1000);
    }
  } catch {
    // Audio not available
  }
}

// Storage key for sound settings
const SOUND_ENABLED_KEY = "medcram_sounds_enabled";

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // Storage unavailable
  }
}

// Conditional sound player that checks settings
export function playSoundIfEnabled(name: SoundName): void {
  if (getSoundEnabled()) {
    playSound(name);
  }
}
