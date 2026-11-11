/* ---------------- Control USB (Gamepad) ----------------
   Cruceta o palanca = caminar / agacharse · A o B = saltar · X o Y = ayudar ✋ · Start = pausa.
   En los menús: cruceta para elegir y A para aceptar. */
const pad = { left: false, right: false, down: false, up: false, jump: false, wave: false, start: false }, padPrev = {};
let padFocus = 0, padSeen = false;
function readPad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  const now = { left: false, right: false, down: false, up: false, jump: false, wave: false, start: false };
  for (const gp of gps) {
    if (!gp) continue;
    const b = i => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5), ax = gp.axes;
    now.left = now.left || b(14) || ax[0] < -0.45; now.right = now.right || b(15) || ax[0] > 0.45;
    now.up = now.up || b(12) || ax[1] < -0.55; now.down = now.down || b(13) || ax[1] > 0.55;
    // controles genéricos: la cruceta llega como "hat" en el eje 9
    if (gp.mapping !== 'standard' && ax.length > 9 && Math.abs(ax[9]) <= 1.01) {
      const d = Math.round((ax[9] + 1) / 0.2857);
      if (d === 0 || d === 1 || d === 7) now.up = true; if (d >= 1 && d <= 3) now.right = true; if (d >= 3 && d <= 5) now.down = true; if (d >= 5 && d <= 7) now.left = true;
    }
    now.jump = now.jump || b(0) || b(1); now.wave = now.wave || b(2) || b(3) || b(5) || b(4); now.start = now.start || b(9) || b(8);
  }
  return now;
}
function pollPad() {
  const now = readPad(), edge = k => now[k] && !padPrev[k];
  if (!padSeen && Object.values(now).some(v => v)) { padSeen = true; initAudio(); }
  if (state === 'play') {
    for (const k of ['left', 'right', 'down', 'jump', 'wave']) { if (now[k] && !padPrev[k]) press(k); else if (!now[k] && padPrev[k]) release(k); }
    if (edge('up')) press('jump'); else if (!now.up && padPrev.up && !now.jump) release('jump');
    if (edge('start')) pause();
  } else {
    // menús: mover el foco entre los botones visibles
    const scr = document.querySelector('.overlay.on');
    if (scr) {
      const btns = [...scr.querySelectorAll('button')].filter(e => e.offsetParent && !e.classList.contains('locked'));
      if (btns.length) {
        if (edge('right') || edge('down')) { padFocus = (padFocus + 1) % btns.length; play('click', 0.3); }
        if (edge('left') || edge('up')) { padFocus = (padFocus - 1 + btns.length) % btns.length; play('click', 0.3); }
        padFocus = Math.min(padFocus, btns.length - 1);
        btns.forEach((e, i) => e.classList.toggle('gpfocus', padSeen && i === padFocus));
        if (edge('jump') || edge('start') || edge('wave')) { initAudio(); const t = btns[padFocus]; padFocus = 0; t.click(); }
      }
    }
  }
  Object.assign(padPrev, now);
}
addEventListener('gamepadconnected', () => { padSeen = true; say('🎮 ¡Control conectado!', 2); });
