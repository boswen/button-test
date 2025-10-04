// DS2 style hold-to-activate button
document.addEventListener("DOMContentLoaded", () => {
  const btn   = document.getElementById("hold-activate");
  const ring  = document.getElementById("hold-activate-progress");
  const bezel = document.getElementById("hold-activate-bezel");

  if (!btn || !ring || !bezel) return;

  // --- Hybrid Web Audio Implementation (Start/Stop Enabled) ---
  let audioCtx = null;
  let audioBuffer = null;
  let loadingPromise = null;
  let currentSource = null; // To hold the reference to the playing sound

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      loadingPromise = loadSound();
    } catch (e) {
      console.error("Web Audio API is not supported.", e);
    }
  }

  async function loadSound() {
    try {
      const response = await fetch("/sfx/activate.mp3");
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Error loading audio: ${error}`);
      throw error;
    }
  }

  async function playSound() {
    if (!audioCtx) {
      initAudio();
    }
    try {
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      await loadingPromise;

      // Stop any previously playing sound before starting a new one
      if (currentSource) {
        currentSource.stop(0);
      }

      if (audioBuffer) {
        // Create a new source, save the reference, and play it
        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(audioCtx.destination);
        currentSource.start(0);
      }
    } catch (error) {
      console.error(`Failed to play sound: ${error}`);
    }
  }

  function stopSound() {
    if (currentSource) {
      currentSource.stop(0);
      currentSource = null;
    }
  }

  // ---- geometry (keep in sync with SVG) ----
  const RADIUS = 30;                          // matches r in the SVG
  const CIRC   = 2 * Math.PI * RADIUS;

  // ---- Bezel: 5 segments with thin gaps + rounded caps ----
  const SEGMENTS = 5;
  const STROKE   = 6;           // must match the SVG stroke-width on the bezel
  let gap = CIRC / 60;          // width of the gaps (smaller = thinner)

  // With stroke-linecap="round", each end adds ~STROKE/2 roundness,
  // which visually eats into the gap from both sides.
  // Increase the gap a bit to compensate for gaps looking too thin
  gap += STROKE * 1;          // tweak or remove if not needed

  const seg = (CIRC / SEGMENTS) - gap;  // fill the rest of each fifth with the segment
  bezel.style.strokeDasharray = `${seg} ${gap}`;
  bezel.style.strokeLinecap   = 'round';

  // Center a gap at the 12 o'clock marker (under the triangle)
  bezel.style.strokeDashoffset = gap / 2;

  // Progress ring start (fully hidden)
  ring.style.strokeDasharray  = CIRC;
  ring.style.strokeDashoffset = CIRC;

  // Hold behavior
  const HOLD_MS = 1500;                       // Under two seconds, like in DS2
  let completed = false;
  let raf = null, t0 = 0, holding = false;

  const setFifthProgress = (frac) => {
    // snap to 0, .2, .4, .6, .8, 1
    const q = Math.min(Math.floor(frac * 5) / 5, 1);
    ring.style.strokeDashoffset = CIRC * (1 - q);
    ring.style.stroke = "rgb(70 165 242)"    // "APAS Blue"
  };

  const stop = (reset=true) => {
    holding = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null; t0 = 0;
    if (reset) setFifthProgress(0);
  };

  // Animation frame loop
  const tick = (t) => {
    if (!holding) return;
    if (!t0) t0 = t;
    const frac = Math.min((t - t0) / HOLD_MS, 1);
    setFifthProgress(frac);

    if (frac >= 1) {
      completed = true;
      try { navigator.vibrate?.(15); } catch {}
      
      // go after tiny cushion so the click isn't cut instantly
      setTimeout(() => { window.location.href = 'https://stackoverflow.com/questions/79777388/play-a-sound-clip-on-first-button-tap-on-mobile'; }, 75);

      stop(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  // pointer down: begin hold + start SFX
  const down = (e) => {
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    if (holding) return;
    holding = true; t0 = 0; completed = false;
    playSound();   // start sound immediately (async covers mobile first-press)
      
    raf = requestAnimationFrame(tick);
  };

  // pointer up/cancel before completion: cancel hold + stop SFX
  const up = (e) => {
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
    const wasHolding = holding;         // to decide SFX stop
    stop(true);
    if (!completed && wasHolding) stopSound();
  };

  // Pointer + keyboard (Space/Enter) listeners
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
  btn.addEventListener('pointerleave', () => { if (!completed) { stop(true); stopSound(); } });
});
