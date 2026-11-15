let audioContext: AudioContext | null = null;

/** Plays one short tone when sound is on. Silent when the setting is off. */
export function playTone(
  enabled: boolean,
  frequency: number,
  duration = 0.12,
  type: OscillatorType = "sine",
) {
  if (!enabled || typeof window === "undefined") return;
  const Context =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Context) return;
  if (!audioContext) audioContext = new Context();
  if (audioContext.state === "suspended") void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

/** Rising pair of notes for a correct sort. */
export function playCorrect(enabled: boolean) {
  playTone(enabled, 523, 0.08);
  window.setTimeout(() => playTone(enabled, 659, 0.12), 90);
}

/** Low note for a wrong sort. */
export function playWrong(enabled: boolean) {
  playTone(enabled, 196, 0.16, "triangle");
}

/** Short blip when the player picks an item up. */
export function playPickup(enabled: boolean) {
  playTone(enabled, 440, 0.08);
}
