/* Ashita & Tathagat – 10-second entrance film.
 * Loads independently from the existing wedding-site script.
 * Gate animation stays untouched. Film plays once after the doors open.
 */
(() => {
  'use strict';
  const enter = document.getElementById('gate-enter');
  if (!enter || document.getElementById('wedding-film-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'wedding-film-overlay';
  overlay.className = 'wedding-film';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Wedding welcome video');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="wedding-film__inner">
      <div class="wedding-film__heading"><span>ASHITA <i>&</i> TATHAGAT</span><small>OUR FOREVER BEGINS HERE</small></div>
      <div class="wedding-film__player">
        <video id="wedding-intro-video" preload="auto" playsinline poster="assets/wedding-intro-poster.jpg" aria-label="Wedding welcome film">
          <source src="assets/wedding-intro.mp4" type="video/mp4">
        </video>
        <div class="wedding-film__play-fallback" id="wedding-film-fallback" hidden>
          <p>Tap to enjoy our welcome film</p>
          <button type="button" id="wedding-film-play">Play video ▶</button>
        </div>
      </div>
      <div class="wedding-film__progress" aria-hidden="true"><span id="wedding-film-progress"></span></div>
      <div class="wedding-film__actions">
        <button type="button" id="wedding-film-sound">Sound on ♫</button>
        <button type="button" id="wedding-film-skip">Skip intro →</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const video = document.getElementById('wedding-intro-video');
  const skip = document.getElementById('wedding-film-skip');
  const sound = document.getElementById('wedding-film-sound');
  const fallback = document.getElementById('wedding-film-fallback');
  const playButton = document.getElementById('wedding-film-play');
  const progress = document.getElementById('wedding-film-progress');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished = false;
  let shown = false;

  function updateSoundLabel() {
    sound.textContent = video.muted ? 'Turn sound on ♫' : 'Mute sound ♫';
    sound.setAttribute('aria-label', video.muted ? 'Turn on video audio' : 'Mute video audio');
  }
  updateSoundLabel();

  function finish() {
    if (finished) return;
    finished = true;
    video.pause();
    overlay.classList.add('is-finishing');
    window.setTimeout(() => {
      overlay.hidden = true;
      document.body.classList.remove('wedding-film-locked');
      const heading = document.getElementById('hero-title');
      if (heading) heading.setAttribute('tabindex', '-1');
      if (heading) heading.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 440);
  }

  async function tryPlay() {
    if (finished) return;
    fallback.hidden = true;
    try {
      await video.play();
      updateSoundLabel();
    } catch (_) {
      // Mobile browsers may require muted autoplay after a delayed user gesture.
      video.muted = true;
      updateSoundLabel();
      try {
        await video.play();
      } catch (_) {
        // Guest can still press Play or Skip; never trap them in the introduction.
        fallback.hidden = false;
        playButton.focus({ preventScroll: true });
      }
    }
  }

  function showVideo() {
    if (shown || finished) return;
    shown = true;
    overlay.hidden = false;
    overlay.classList.add('is-visible');
    skip.focus({ preventScroll: true });
    void tryPlay();
  }

  // The existing site's door-opening animation takes approximately 2.75s.
  enter.addEventListener('click', () => {
    document.body.classList.add('wedding-film-locked');
    video.load();
    window.setTimeout(showVideo, reducedMotion ? 0 : 2800);
  }, { once: true });

  video.addEventListener('ended', finish);
  video.addEventListener('error', () => {
    if (!shown) return;
    fallback.hidden = false;
    fallback.querySelector('p').textContent = 'The film could not load. Continue to the invitation.';
    playButton.hidden = true;
    window.setTimeout(finish, 1700);
  });
  video.addEventListener('timeupdate', () => {
    if (video.duration > 0 && Number.isFinite(video.duration)) {
      progress.style.width = `${Math.min(100, 100 * video.currentTime / video.duration)}%`;
    }
  });
  video.addEventListener('volumechange', updateSoundLabel);
  skip.addEventListener('click', finish);
  playButton.addEventListener('click', () => void tryPlay());
  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    updateSoundLabel();
    if (video.paused) void tryPlay();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && shown && !finished) finish();
  });
})();
