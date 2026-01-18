// Sound effects system with Web Audio API

type SoundDefinition = {
  type: OscillatorType;
  frequency?: number;
  duration: number;
  sequence?: number[];
  gain?: number;
  detune?: number;
  stepDuration?: number;
  stepGap?: number;
};

const SOUNDS: Record<string, SoundDefinition> = {
  select: { frequency: 540, duration: 45, type: "triangle", gain: 0.12 },
  click: { frequency: 620, duration: 35, type: "sine", gain: 0.08 },
  navigate: { sequence: [420, 520], duration: 140, type: "triangle", gain: 0.12, stepGap: 0.08 },
  advance: { sequence: [520, 660, 880], duration: 160, type: "sine", gain: 0.16, stepGap: 0.09 },
  correct: { sequence: [660, 880, 1320], duration: 180, type: "sine", gain: 0.18, stepGap: 0.1 },
  incorrect: { sequence: [280, 210, 160], duration: 260, type: "sawtooth", gain: 0.24, detune: 40, stepGap: 0.12 },
  complete: { sequence: [523, 659, 784, 1046], duration: 200, type: "sine", gain: 0.18, stepGap: 0.1 },
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
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const sound = SOUNDS[name];
    const baseGain = sound.gain ?? 0.16;

    if (sound.sequence && sound.sequence.length > 0) {
      const stepDuration = (sound.stepDuration ?? sound.duration) / 1000;
      const stepGap = sound.stepGap ?? 0;

      sound.sequence.forEach((freq, i) => {
        const start = ctx.currentTime + i * (stepDuration + stepGap);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = sound.type;
        osc.frequency.setValueAtTime(freq, start);
        if (sound.detune) {
          osc.detune.setValueAtTime(sound.detune, start);
        }

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(baseGain, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + stepDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + stepDuration + 0.02);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const duration = sound.duration / 1000;

      osc.type = sound.type;
      osc.frequency.value = sound.frequency ?? 440;
      if (sound.detune) {
        osc.detune.setValueAtTime(sound.detune, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(baseGain, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.02);
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
