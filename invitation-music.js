/* Background music: begins after the gate film, loops while the invitation is open.
   The AudioContext is unlocked by the guest's entrance click. Guest stays in control. */
(() => {
  'use strict';
  const gateButton = document.getElementById('gate-enter');
  if (!gateButton || document.getElementById('invitation-music-toggle')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'invitation-music-toggle';
  button.className = 'invitation-music-toggle';
  button.setAttribute('aria-label', 'Play invitation background music');
  button.setAttribute('aria-pressed', 'false');
  button.hidden = true;
  button.textContent = '♫ Play music';
  document.body.appendChild(button);

  const musicURL = 'assets/invitation-background.mp3';
  const AudioContextType = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let gain = null;
  let buffer = null;
  let source = null;
  let loading = null;
  let fallbackAudio = null;
  let started = false;
  let ready = false;
  let audible = false;
  const targetGain = 0.42;

  function updateLabel(message) {
    button.hidden = !ready;
    button.textContent = message || (audible ? '♫ Mute music' : '♫ Play music');
    button.setAttribute('aria-label', audible ? 'Mute invitation background music' : 'Play invitation background music');
    button.setAttribute('aria-pressed', String(audible));
  }

  // Create and resume the audio engine *within* the gate click, which is a real
  // user gesture. This is required by browser policies for audible playback.
  function unlock() {
    if (context || !AudioContextType) return;
    try {
      context = new AudioContextType();
      gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      // Do not await before resuming: the gesture context must remain active.
      void context.resume().catch(() => {});
      loading = fetch(musicURL)
        .then(r => { if (!r.ok) throw new Error('Soundtrack unavailable'); return r.arrayBuffer(); })
        .then(data => context.decodeAudioData(data))
        .then(decoded => { buffer = decoded; return decoded; })
        .catch(() => null); // Avoid an unhandled rejection while the film plays.
    } catch (_) { context = null; }
  }

  async function startAudio() {
    if (started) return;
    started = true;
    ready = true;
    updateLabel('♫ Loading music…');
    try {
      if (!context) throw new Error('No Web Audio');
      if (!(await (loading || Promise.resolve(null)))) throw new Error('No audio data');
      await context.resume();
      if (context.state !== 'running') throw new Error('Playback requires interaction');
      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start(0);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.8);
      audible = true;
      updateLabel();
    } catch (_) {
      // If automatic playback is blocked, keep the invitation usable and let
      // the guest explicitly start the soundtrack from the visible button.
      audible = false;
      updateLabel('♫ Tap to play music');
    }
  }

  async function toggleMusic() {
    if (!ready) return;
    if (context && source) {
      try {
        await context.resume();
        audible = !audible;
        gain.gain.setTargetAtTime(audible ? targetGain : 0, context.currentTime, 0.12);
      } catch (_) { audible = false; }
    } else if (context && buffer && gain) {
      started = false;
      await startAudio();
    } else {
      if (!fallbackAudio) {
        fallbackAudio = new Audio(musicURL);
        fallbackAudio.loop = true;
        fallbackAudio.volume = targetGain;
      }
      try {
        if (audible) { fallbackAudio.pause(); audible = false; }
        else { await fallbackAudio.play(); audible = true; }
      } catch (_) { audible = false; }
    }
    updateLabel();
  }

  button.addEventListener('click', () => { void toggleMusic(); });
  gateButton.addEventListener('click', unlock, { once: true });

  const film = document.getElementById('wedding-film-overlay');
  if (film) {
    // Film script hides its overlay AFTER its end/fade-out, which is the cue
    // to reveal the invitation and start the separate looping soundtrack.
    let filmShown = false;
    const observer = new MutationObserver(() => {
      if (!film.hidden) filmShown = true;
      if (filmShown && film.hidden && !ready) {
        observer.disconnect();
        void startAudio();
      }
    });
    observer.observe(film, { attributes: true, attributeFilter: ['hidden'] });
  } else {
    // Graceful fallback if the optional video intro isn't installed.
    gateButton.addEventListener('click', () => {
      window.setTimeout(() => { void startAudio(); }, 2900);
    }, { once: true });
  }
})();
