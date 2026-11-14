'use strict';
/* =========================================================
   La Aventura de Mandy — ¡Cuidemos el planeta!
   Juego de plataformas ecológico para peques.
   Cambia HERO_NAME para poner otro nombre en el título.
   ========================================================= */
const HERO_NAME = 'Mandy';

const T = 48;            // tamaño de una "baldosa"
const VIEW_H = 540;      // alto lógico de la pantalla
const G = 432;           // altura del suelo base
const INK = '#4a2f55';

// --- Ajustes de dificultad (pensados para 5 años) ---
const SPEED = 250, CROUCH_SPEED = 130, JUMP_V = 760, GRAV = 2000, SPRING_V = 1150;
const STAND_H = 96, CROUCH_H = 58, MAX_HEARTS = 3;

/* ---------------- Canvas ---------------- */
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
let VIEW_W = 960, RS = 1;
function resize() {
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  if (!(w > 0 && h > 0)) return; // ventana oculta o sin tamaño todavía (evita la cámara NaN)
  // Vertical (celular o tablet parados): el juego arriba y abajo queda espacio para los controles
  const portrait = h > w * 1.08;
  document.body.classList.toggle('portrait', portrait);
  let sc;
  if (portrait) {
    const top = h < 700 ? 56 : 66, room = h - top - (w < 600 ? 250 : 280);
    sc = Math.min(w / 480, room / VIEW_H); VIEW_W = Math.min(w / sc, 1500);
    document.body.style.setProperty('--gt', top + 'px');
    document.body.style.setProperty('--gb', Math.round(top + VIEW_H * sc - 2) + 'px');
  } else { sc = Math.min(h / VIEW_H, w / 600); VIEW_W = Math.min(w / sc, 1500); }
  setTimeout(rotTipCheck, 0);
  cv.style.width = VIEW_W * sc + 'px'; cv.style.height = VIEW_H * sc + 'px';
  cv.width = Math.round(VIEW_W * sc * dpr); cv.height = Math.round(VIEW_H * sc * dpr);
  RS = sc * dpr;
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200)); resize();
// Aviso "gira el teléfono": en un aparato táctil parado, al entrar a un nivel. Se puede elegir jugar en vertical.
let vertOK = false;
function rotTipCheck() {
  const el = document.getElementById('rotTip'); if (!el) return;
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const show = touch && !vertOK && document.body.classList.contains('portrait') && (state === 'intro' || state === 'select');
  el.classList.toggle('on', show);
}
document.getElementById('btnVertical').onclick = () => { vertOK = true; rotTipCheck(); };

/* ---------------- Sprites del personaje ----------------
   OLD: hoja original (personaje de pie mide 310 px). NEW: hojas nuevas (445 px).
   AX = dónde está el centro del cuerpo dentro del recorte (0 = izquierda, 1 = derecha). */
const SPR = {};
const OLD = ['idle', 'jump', 'crouch', 'fall', 'wave', 'celebrate'];
const NEW = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'carry1', 'carry2', 'water', 'pet', 'pickup', 'toss', 'plant', 'thumbs', 'point', 'hug'];
OLD.concat(NEW).forEach(n => { const im = new Image(); im.src = 'assets/' + n + '.png'; SPR[n] = im; });
const H_OLD = 310, H_NEW = 445, DRAW_H = 114;
const AX = { water: 0.3, pet: 0.36, pickup: 0.42, toss: 0.36, plant: 0.4, thumbs: 0.42, carry1: 0.45, carry2: 0.45, wave: 0.45 };
const WALK = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'];

/* ---------------- Animalitos, bichitos y flores (dibujos hechos en Canva) ---------------- */
const BICHOS = ['elephant', 'giraffe', 'lion', 'monkey', 'panda', 'penguin', 'koala', 'zebra', 'hippo', 'kangaroo', 'flamingo', 'parrot', 'seal', 'octopus', 'dolphin', 'bear', 'cow', 'pig', 'lamb', 'chick', 'hen', 'foal', 'goat', 'llama', 'beaver', 'raccoon', 'mouse', 'chinchilla', 'bunny', 'cat', 'dog', 'bird', 'turtle', 'duck', 'squirrel', 'frog', 'hedgehog', 'fox', 'deer', 'owl', 'snail', 'crab', 'bee', 'gull', 'butterfly', 'ladybug', 'fish', 'sunflower', 'tulip', 'daisy', 'rose', 'apple'];
const COSAS = ['vet_dog_1', 'vet_dog_2', 'vet_dog_3', 'vet_dog_4', 'vet_cat_1', 'vet_cat_2', 'vet_cat_3', 'vet_cat_4', 'f_platano', 'f_naranja', 'f_frutilla', 'f_sandia', 'f_pina', 'f_pera', 'f_cereza', 'f_limon', 'f_durazno', 'f_kiwi', 'f_mango', 'f_coco', 'v_estrella', 'v_avion', 'v_iguana', 'v_iglu', 'v_isla', 'v_ola', 'v_uvas', 'v_unicornio', 'v_oruga', 'v_ojo', 'v_anillo', 'v_paraguas', 't_bottle', 't_can', 't_paper', 't_bag', 't_banana', 't_juice', 'bin', 'sack', 'wilted', 'sprout', 'mush_small', 'mush_big', 'tree', 'pine', 'palm', 'bush', 'rock', 'stump', 'log', 'sign', 'flag', 'platform', 'cloud', 'rainbow', 'shell', 'starfish', 'sandcastle', 'bramble', 'urchin', 'haystack', 'fence', 'lily', 'reeds', 'snowpine', 'snowrock', 'barn'];
const IMG = {};
BICHOS.forEach(n => { const im = new Image(); im.src = 'assets/bichos/' + n + '.png'; IMG[n] = im; });
COSAS.forEach(n => { const im = new Image(); im.src = 'assets/cosas/' + n + '.png'; IMG[n] = im; });
const BG = {}; ['garden', 'beach', 'forest', 'farm', 'lake', 'mountain'].forEach(n => { const im = new Image(); im.src = 'assets/fondos/' + n + '.jpg'; BG[n] = im; });
const FLOWERS = ['sunflower', 'tulip', 'daisy', 'rose'];
// Español / inglés para enseñar palabras
const WORDS = { elephant: ['Elefante', 'Elephant'], giraffe: ['Jirafa', 'Giraffe'], lion: ['León', 'Lion'], monkey: ['Monito', 'Monkey'], panda: ['Panda', 'Panda'], penguin: ['Pingüino', 'Penguin'], koala: ['Koala', 'Koala'], zebra: ['Cebra', 'Zebra'], hippo: ['Hipopótamo', 'Hippo'], kangaroo: ['Canguro', 'Kangaroo'], flamingo: ['Flamenco', 'Flamingo'], parrot: ['Loro', 'Parrot'], seal: ['Foca', 'Seal'], octopus: ['Pulpo', 'Octopus'], dolphin: ['Delfín', 'Dolphin'], bear: ['Osito', 'Bear'], cow: ['Vaquita', 'Cow'], pig: ['Chanchito', 'Pig'], lamb: ['Corderito', 'Lamb'], chick: ['Pollito', 'Chick'], hen: ['Gallina', 'Hen'], foal: ['Caballito', 'Horse'], goat: ['Cabrita', 'Goat'], llama: ['Llama', 'Llama'], beaver: ['Castor', 'Beaver'], raccoon: ['Mapache', 'Raccoon'], mouse: ['Ratoncito', 'Mouse'], chinchilla: ['Chinchilla', 'Chinchilla'], bunny: ['Conejito', 'Bunny'], cat: ['Gatito', 'Cat'], dog: ['Perrito', 'Dog'], bird: ['Pajarito', 'Bird'], turtle: ['Tortuga', 'Turtle'], duck: ['Patito', 'Duck'], squirrel: ['Ardilla', 'Squirrel'], frog: ['Rana', 'Frog'], hedgehog: ['Erizo', 'Hedgehog'], fox: ['Zorrito', 'Fox'], deer: ['Venadito', 'Deer'], owl: ['Búho', 'Owl'], sunflower: ['Girasol', 'Sunflower'], tulip: ['Tulipán', 'Tulip'], daisy: ['Margarita', 'Daisy'], rose: ['Rosa', 'Rose'], butterfly: ['Mariposa', 'Butterfly'] };
const COLS = { red: ['Rojo', 'Red', '#e8453c', '🔴'], blue: ['Azul', 'Blue', '#3f8fe8', '🔵'], yellow: ['Amarillo', 'Yellow', '#ffd23f', '🟡'], green: ['Verde', 'Green', '#4cc25a', '🟢'], orange: ['Naranja', 'Orange', '#ff9a2e', '🟠'], purple: ['Morado', 'Purple', '#9b5de5', '🟣'], pink: ['Rosado', 'Pink', '#ff7fb6', '🩷'], brown: ['Café', 'Brown', '#9a6537', '🟤'] };
const NUMS_EN = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const FH = { elephant: 66, giraffe: 84, lion: 62, monkey: 58, panda: 60, penguin: 56, koala: 56, zebra: 66, hippo: 60, kangaroo: 68, flamingo: 76, parrot: 54, seal: 50, octopus: 54, dolphin: 52, bear: 62, cow: 60, pig: 52, lamb: 54, chick: 42, hen: 54, foal: 66, goat: 58, llama: 74, beaver: 52, raccoon: 54, mouse: 44, chinchilla: 48, bunny: 64, cat: 54, dog: 56, bird: 48, turtle: 44, duck: 54, squirrel: 58, frog: 46, hedgehog: 46, fox: 58, deer: 74 };
const ready = im => im && (im.getContext || (im.complete && im.naturalWidth));
// Versión gris (para lo que está triste): se hace con modos de mezcla, sin leer píxeles (funciona abriendo el archivo directo)
const GREY = {};
function grey(n) {
  if (GREY[n]) return GREY[n];
  const im = IMG[n]; if (!ready(im)) return null;
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d');
  g.drawImage(im, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(235,230,220,.25)'; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);
  return (GREY[n] = c);
}
// Dibuja una imagen apoyada en (x, y) = centro de los pies. sx/sy = estirar, rot = girar desde la base
function drawImg(src, x, y, h, sx, sy, rot, alpha) {
  if (typeof src === 'string') src = IMG[src];
  if (!ready(src)) return;
  const iw = src.naturalWidth || src.width, ih = src.naturalHeight || src.height, w = h * iw / ih;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx || 1, sy || 1); if (alpha !== undefined) ctx.globalAlpha *= alpha;
  ctx.drawImage(src, -w / 2, -h, w, h); ctx.restore();
}

/* ---------------- Guardado ---------------- */
let save = { unlocked: 1, best: [0, 0, 0, 0, 0, 0], muted: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('aventura-save') || '{}')); } catch (e) {}
function persist() { try { localStorage.setItem('aventura-save', JSON.stringify(save)); } catch (e) {} }

/* ---------------- Sonido ----------------
   Efectos y música: archivos en assets/audio (generados con ElevenLabs).
   tone() queda para un par de avisos cortitos sin archivo. */
let AC = null, audioOK = false, musWant = 'menu';
const AUD = {};
['jump', 'star', 'pickup', 'bin', 'water', 'grow', 'pet', 'oops', 'win', 'boing', 'splash', 'click'].forEach(n => { const a = new Audio('assets/audio/' + n + '.mp3'); a.preload = 'auto'; AUD[n] = [a]; });
const MUS = { menu: new Audio('assets/audio/musica_menu.mp3'), game: new Audio('assets/audio/musica_juego.mp3') };
MUS.menu.loop = MUS.game.loop = true; MUS.menu.volume = 0.3; MUS.game.volume = 0.22;
function play(n, vol, maxDur) {
  if (save.muted || !audioOK) return;
  const pool = AUD[n]; if (!pool) return; let a = pool.find(x => x.paused || x.ended);
  if (!a) { if (pool.length < 4) { a = pool[0].cloneNode(); pool.push(a); } else a = pool[0]; }
  try { a.currentTime = 0; } catch (e) {}
  a.volume = vol || 0.6; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {});
  if (maxDur) setTimeout(() => a.pause(), maxDur * 1000);
}
/* --- Voces (ElevenLabs) ---
   La voz es una compañera: felicita a veces, avisa cuando ve algo nuevo y enseña palabras en inglés,
   pero NO narra cada acción. Clips nuevos en assets/voz2/<clave>.mp3 (lista en VOZ_NUEVA);
   mientras falten, se usan los antiguos de assets/voz o se salta la frase. */
const VOZ_NUEVA = new Set(window.VOZ_LISTA || []);
const VOZ_VIEJA = { p1: 'muybien', p2: 'excelente', p3: 'super', p4: 'muybien', p5: 'excelente', e_vamos: 'tupuedes', e_casi: 'casi', q_puerta: 'puerta', w_win: 'lograste', p_todo: 'gracias', eningles: 'eningles', q_busca: 'busca', intro0: 'intro0', intro1: 'intro1', intro2: 'intro2' };
const VOZ = {}; let vozQ = [], vozCur = null, talkCD = 0;
function clipSrc(k) {
  if (k === '_') return '_';
  if (VOZ_NUEVA.has(k)) return 'assets/voz2/' + k + '.mp3';
  const old = VOZ_VIEJA[k] || (/^(en_|n\d|cuanto|mas|menos)/.test(k) ? k : null);
  return old ? 'assets/voz/' + old + '.mp3' : null;
}
function speak(list, force) {
  if (save.muted || !audioOK) return;
  list = list.filter(k => clipSrc(k)); if (!list.length) return;
  if (vozCur && !force) { vozQ = vozQ.concat(list); return; }
  if (vozCur) { try { vozCur.pause(); } catch (e) {} vozCur.onended = null; }
  vozQ = list.slice(); nextVoz();
}
function nextVoz() {
  const n = vozQ.shift();
  if (!n) { vozCur = null; MUS.game.volume = 0.22; return; }
  if (n === '_') { vozCur = vozCur || { pause() {} }; setTimeout(nextVoz, 650); return; } // pausa entre palabras
  const a = VOZ[n] || (VOZ[n] = new Audio(clipSrc(n)));
  vozCur = a; MUS.game.volume = 0.07;
  try { a.currentTime = 0; } catch (e) {}
  // los clips viejos en inglés eran muy rápidos: se tocan más lento sin cambiar el tono
  a.preservesPitch = true; a.playbackRate = !VOZ_NUEVA.has(n) && /^en_/.test(n) ? 0.78 : 1;
  a.onended = () => setTimeout(nextVoz, 160); a.onerror = nextVoz;
  const pr = a.play(); if (pr && pr.catch) pr.catch(() => nextVoz());
}
function shutUp() { vozQ = []; if (vozCur) { vozCur.onended = null; try { vozCur.pause(); } catch (e) {} vozCur = null; } MUS.game.volume = 0.22; }
const pick = a => a[Math.floor(Math.random() * a.length)];
// Comentario de la compañera: sólo si no está hablando, con probabilidad y pausa entre comentarios
function chat(keys, prob, cd) {
  if (vozCur || talkCD > 0 || Math.random() > (prob === undefined ? 1 : prob)) return false;
  keys = keys.filter(k => clipSrc(k)); if (!keys.length) return false;
  speak(keys); talkCD = cd || 7; return true;
}
function praise(prob) { chat([pick(['p1', 'p2', 'p3', 'p4', 'p5'])], prob === undefined ? 0.4 : prob, 9); }
function syncMusic() {
  for (const k in MUS) {
    const a = MUS[k], on = audioOK && !save.muted && k === musWant && !document.hidden && state !== 'pause';
    if (on) { if (a.paused) { const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } } else if (!a.paused) a.pause();
  }
}
function initAudio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume();
  if (!audioOK) { audioOK = true; syncMusic(); }
}
function tone(freq, dur, type, vol, delay, slideTo) {
  if (!AC || save.muted) return;
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  jump() { play('jump', 0.45); },
  star() { play('star', 0.3); },
  heart() { tone(660, 0.1, 'sine', 0.14); tone(880, 0.1, 'sine', 0.14, 0.09); tone(1175, 0.2, 'sine', 0.14, 0.18); },
  hurt() { play('oops', 0.6); },
  stomp() { tone(520, 0.1, 'square', 0.06, 0, 260); },
  spring() { play('boing', 0.6); },
  wave() { tone(784, 0.1, 'sine', 0.13); tone(1047, 0.18, 'sine', 0.13, 0.1); },
  flag() { tone(523, 0.1, 'triangle', 0.12); tone(784, 0.2, 'triangle', 0.12, 0.1); },
  splash() { play('splash', 0.6); },
  win() { play('win', 0.8); },
};

/* ---------------- Controles ---------------- */
const keys = { left: false, right: false, down: false, jump: false, wave: false, greet: false };
let jumpPressed = false, wavePressed = false, greetPressed = false;   // "greet" = saludar 👋   // "wave" = botón de ayudar (✋)
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyH: 'wave', KeyX: 'wave', KeyE: 'wave', Enter: 'wave', KeyG: 'greet' };
function press(k) { if (!keys[k]) { if (k === 'jump') jumpPressed = true; if (k === 'wave') wavePressed = true; if (k === 'greet') greetPressed = true; } keys[k] = true; }
function release(k) { keys[k] = false; }
addEventListener('keydown', e => {
  initAudio();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pause(); else if (state === 'pause') resume(); return; }
  if (state === 'intro' && (e.code === 'Enter' || e.code === 'Space')) { beginPlay(); e.preventDefault(); return; }
  const k = KEYMAP[e.code]; if (k && state === 'play') { press(k); e.preventDefault(); }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { release(k); e.preventDefault(); } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
document.querySelectorAll('.tbtn').forEach(b => {
  const k = b.dataset.k;
  const dn = e => { e.preventDefault(); initAudio(); try { b.setPointerCapture(e.pointerId); } catch (_) {} press(k); b.classList.add('down'); };
  const up = e => { e.preventDefault(); release(k); b.classList.remove('down'); };
  b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
document.addEventListener('contextmenu', e => { if (isTouch) e.preventDefault(); });
// Palanca táctil: se arrastra la perilla; izquierda/derecha caminan y abajo agacha.
(function () {
  const st = document.getElementById('stick'), kb = document.getElementById('knob'); if (!st) return;
  let id = null;
  const set = (k, on) => { if (on && !keys[k]) press(k); else if (!on && keys[k]) release(k); };
  function move(e) {
    const r = st.getBoundingClientRect(), R = r.width / 2 - 20;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    kb.style.transform = `translate(${dx}px,${dy}px)`;
    const dead = R * 0.28;
    set('left', dx < -dead); set('right', dx > dead); set('down', dy > R * 0.55 && Math.abs(dx) < dy);
  }
  function end(e) {
    if (e.pointerId !== id) return; id = null; st.classList.remove('on');
    kb.style.transform = ''; set('left', false); set('right', false); set('down', false);
  }
  st.addEventListener('pointerdown', e => {
    e.preventDefault(); initAudio(); id = e.pointerId; st.classList.add('on');
    try { st.setPointerCapture(id); } catch (_) {} move(e);
  });
  st.addEventListener('pointermove', e => { if (e.pointerId === id) { e.preventDefault(); move(e); } });
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end); st.addEventListener('lostpointercapture', end);
})();

/* ---------------- Control USB (Gamepad) ----------------
   Cruceta o palanca = caminar / agacharse · Start = pausa.
   PlayStation: ✕ = saltar · ○ (o □) = ayudar ✋ · △ = saludar 👋.
   Con mapeo "standard" (DualShock 4/5, Xbox): 0=✕/A 1=○/B 2=□/X 3=△/Y.
   Controles PS clásicos con adaptador USB (sin mapeo): 0=△ 1=○ 2=✕ 3=□ 8=Select 9=Start.
   Abrir el juego con ?pad muestra qué número envía cada botón. */
const PADMAP = { std: { jump: [0], wave: [1, 2], greet: [3], start: [9, 8] }, ps1: { jump: [2], wave: [1, 3], greet: [0], start: [9, 8] } };
const padDebug = /[?&]pad/.test(location.search);
/*
   En los menús: cruceta para elegir y A para aceptar. */
const pad = { left: false, right: false, down: false, up: false, jump: false, wave: false, greet: false, start: false }, padPrev = {};
let padFocus = 0, padSeen = false;
let rawNow = new Set(), rawPrev = new Set(), padStd = false, padCapture = null, padFrom = 'title';
function readPad() {
  rawPrev = rawNow; rawNow = new Set();
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  const now = { left: false, right: false, down: false, up: false, jump: false, wave: false, greet: false, start: false };
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
    const m = save.pad || (gp.mapping === 'standard' ? PADMAP.std : PADMAP.ps1), any = l => (l || []).some(b);
    gp.buttons.forEach((x, i) => { if (x.pressed || x.value > 0.5) rawNow.add(i); }); padStd = gp.mapping === 'standard';
    now.jump = now.jump || any(m.jump); now.wave = now.wave || any(m.wave); now.greet = now.greet || any(m.greet); now.start = now.start || any(m.start);
    if (padDebug) { const on = gp.buttons.map((x, i) => (x.pressed || x.value > 0.5) ? i : -1).filter(i => i >= 0); window.__padInfo = (gp.mapping || 'sin mapeo') + ' · botones: ' + (on.join(', ') || '—') + ' · ' + gp.id.slice(0, 40); }
  }
  return now;
}
let padBox = null;
function pollPad() {
  const now = readPad(), edge = k => now[k] && !padPrev[k];
  if (padDebug) {
    if (!padBox) { padBox = document.createElement('div'); padBox.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;background:#4a2f55;color:#fff;font:16px monospace;padding:6px 10px;border-radius:8px;pointer-events:none'; document.body.appendChild(padBox); }
    padBox.textContent = '🎮 ' + (window.__padInfo || 'presiona un botón del control') + ' → ' + ['jump', 'wave', 'greet', 'start'].filter(k => now[k]).map(k => ({ jump: 'saltar', wave: 'ayudar', greet: 'saludar', start: 'start' })[k]).join(' ');
  }
  if (!padSeen && Object.values(now).some(v => v)) { padSeen = true; initAudio(); }
  if (state === 'pad') padScreenTick();
  if (padCapture) { padSnapshot(now); return; }
  if (state === 'play') {
    for (const k of ['left', 'right', 'down', 'jump', 'wave', 'greet']) { if (now[k] && !padPrev[k]) press(k); else if (!now[k] && padPrev[k]) release(k); }
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

/* ---------------- Utilidades ---------------- */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function circ(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); }
function ell(x, y, a, b) { ctx.beginPath(); ctx.ellipse(x, y, a, b, 0, 0, 7); }
function fs(fill, lw) { ctx.fillStyle = fill; ctx.fill(); if (lw !== 0) { ctx.lineWidth = lw || 3; ctx.strokeStyle = INK; ctx.stroke(); } }
function starPath(cx, cy, R, r, rot) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r : R; ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } ctx.closePath(); }
function heartPath(cx, cy, s) { ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.9); ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.2, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.4); ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.5, cy - s * 0.2, cx, cy + s * 0.9); ctx.closePath(); }

/* ---------------- Mundos ---------------- */
// bg = fondo pintado (assets/fondos). decor = cosas que aparecen sobre el suelo.
const THEMES = {
  garden: { bg: 'garden', dirt: '#c98d5e', dirtDark: '#b3774b', top: '#6cc95f', topLight: '#a3e88f', water: '#6ec6f0', waterLight: '#b5e6ff', walker: 'snail', flyer: 'bee', hazard: 'bramble', decor: ['flower', 'fl', 'tuft', 'tree', 'bush', 'fl', 'flower', 'rock'], happy: '¡El jardín está feliz!', ground: 'Jardín' },
  beach: { bg: 'beach', dirt: '#f1cb7c', dirtDark: '#dfb25e', top: '#ffeeb5', topLight: '#fff9dd', water: '#3fb7e6', waterLight: '#a8e8ff', walker: 'crab', flyer: 'gull', hazard: 'urchin', decor: ['palm', 'shell', 'starfish', 'sandcastle', 'tuft', 'shell'], happy: '¡La playa está limpia!' },
  forest: { bg: 'forest', dirt: '#a9744d', dirtDark: '#8f5f3d', top: '#55b660', topLight: '#8ad88c', water: '#5fb4e6', waterLight: '#b5e6ff', walker: 'snail', flyer: 'bee', hazard: 'bramble', decor: ['pine', 'mush', 'tuft', 'tree', 'bush', 'fl', 'stump', 'rock'], happy: '¡El bosque está feliz!' },
  farm: { bg: 'farm', dirt: '#b9875a', dirtDark: '#a0714a', top: '#7ccf5c', topLight: '#aee98e', water: '#6ec6f0', waterLight: '#b5e6ff', walker: 'snail', flyer: 'bee', hazard: 'bramble', decor: ['haystack', 'fence', 'fl', 'bush', 'tuft', 'flower', 'tree', 'fence'], happy: '¡La granja está feliz!' },
  lake: { bg: 'lake', dirt: '#9c7a55', dirtDark: '#856546', top: '#62c26a', topLight: '#98e095', water: '#5aaee0', waterLight: '#b0e2ff', walker: 'snail', flyer: 'bee', hazard: 'bramble', decor: ['reeds', 'tree', 'rock', 'fl', 'tuft', 'bush', 'reeds'], happy: '¡El lago está limpio!' },
  mountain: { bg: 'mountain', dirt: '#a08a7a', dirtDark: '#8a7464', top: '#80cf78', topLight: '#b2eaa6', water: '#6cc0ec', waterLight: '#c2ecff', walker: 'snail', flyer: 'bee', hazard: 'bramble', decor: ['snowpine', 'snowrock', 'rock', 'pine', 'stump', 'fl', 'tuft'], happy: '¡La montaña está feliz!' },
};
const BACK_DECOR = { tree: 1, palm: 1, pine: 1, snowpine: 1, barn: 1 };

/* Cada nivel: "b.quiz(x, tipo)" pone un reto del búho (suma, resta o inglés) con su islita;
   "b.o += 11" corre todo lo que sigue 11 baldosas a la derecha para hacerle espacio.
   "b.mush(x)" = hongo dormido: si lo riegas crece y sirve para saltar muy alto. */
const LEVELS = [
  { name: 'El Jardín', icon: '🌷', theme: 'garden', width: 104, build(b) {
    b.ground(0, 20); b.sign(4, '➡️', 'camina'); b.trash(7); b.sign(9, '✋', 'recoge'); b.bin(11); b.friend(14, 'bunny'); b.sign(17, '⬆️', 'salta'); b.starRow(6, 2.2, 3);
    b.ground(20, 26, 1); b.starRow(21, 2.4, 2); b.plant(23.5, 1); b.sign(25, '💧', 'riega', 1);
    b.ground(26, 36); b.seed(27.5); b.hazard(30); b.starArc(29, 2.2, 3); b.trash(33.5);
    b.starArc(35, 1.6, 4);
    b.quiz(38, 'add'); b.o += 11;
    b.ground(38, 54); b.sign(40, '⬇️', 'agáchate'); b.log(42, 4); b.starRow(42, 0.6, 4); b.walker(47, 52);
    b.starArc(53, 1.6, 4);
    b.ground(56, 70); b.flag(57); b.bin(58.5); b.plant(60.5); b.plat(59, 2, 3); b.starRow(59, 3, 3); b.plat(63, 4, 3); b.star(63, 5); b.heart(64, 5); b.star(65, 5); b.friend(62, 'duck'); b.trash(64.5); b.sign(66.5, '⬇️', 'agáchate'); b.flyer(68.5);
    b.starArc(69, 1.6, 4);
    b.ground(72, 86); b.mush(73.5); b.trash(75.8); b.plat(76, 6, 4); b.starRow(76, 7, 4); b.plant(78); b.seed(80.5); b.friend(83, 'cat'); b.bin(85);
    b.starArc(85, 1.6, 4);
    b.quiz(88, 'eng'); b.o += 11;
    b.ground(88, 104); b.walker(89, 93); b.trash(94.3); b.hazard(96); b.starArc(95, 2.2, 3); b.bin(98); b.goal(101);
  } },
  { name: 'La Playa', icon: '🏖️', theme: 'beach', width: 126, build(b) {
    b.ground(0, 14); b.trash(3); b.trash(6); b.starRow(4, 2.2, 2); b.friend(9, 'turtle'); b.bin(12);
    b.starArc(13, 1.6, 4);
    b.quiz(16, 'eng'); b.o += 11;
    b.ground(16, 28); b.trash(16.8); b.walker(18, 23); b.hazard(25); b.starArc(24, 2.2, 3); b.seed(27);
    b.ground(28, 34, 1); b.starRow(29, 2.4, 2); b.plant(31.5, 1); b.ground(34, 40, 2); b.trash(35, 2); b.flyer(37, 2); b.starRow(36, 2.6, 3);
    b.mover(40.3, 2, 3, 2.7, 0, 5); b.starRow(41, 3.2, 5);
    b.quiz(46, 'add'); b.o += 11;
    b.ground(46, 60); b.flag(47); b.bin(48.5); b.log(50, 5); b.starRow(50, 0.6, 5); b.walker(55, 60);
    b.starArc(59, 1.6, 4);
    b.ground(62, 74); b.mush(63); b.plat(65, 4, 3); b.starRow(65, 5, 3); b.plat(69, 6, 3); b.star(69, 7); b.heart(70, 7); b.star(71, 7); b.trash(65.5); b.plant(67.5); b.bin(70); b.friend(72, 'bird');
    b.plat(75, 0, 1); b.starArc(74, 1.4, 3);
    b.ground(77, 90); b.trash(78); b.flyer(80); b.hazard(83); b.starArc(82, 2.2, 3); b.seed(85); b.flyer(87); b.trash(89);
    b.ground(90, 96, 1); b.walker(91, 96, 1); b.starRow(91, 3.4, 4);
    b.plat(97, 2, 2); b.star(97.5, 3); b.plat(100, 3, 2); b.star(100.5, 4);
    b.quiz(102, 'sub'); b.o += 11;
    b.ground(102, 126); b.flag(103); b.bin(104.5); b.friend(106.5, 'dog'); b.plant(108); b.walker(109.5, 114); b.hazard(116); b.starArc(115, 2.2, 3); b.trash(117.5); b.bin(120); b.goal(123);
  } },
  { name: 'El Bosque', icon: '🌲', theme: 'forest', width: 142, build(b) {
    b.ground(0, 12); b.trash(3); b.trash(5.5); b.friend(8, 'squirrel'); b.bin(10.5); b.starRow(4, 2.2, 2);
    b.starArc(11, 1.6, 4);
    b.quiz(14, 'eng'); b.o += 11;
    b.ground(14, 22); b.walker(15, 21);
    b.ground(22, 26, 1); b.plant(24, 1); b.ground(26, 30, 2); b.trash(28, 2); b.star(27, 3.2); b.ground(30, 34, 3); b.seed(32, 3); b.star(31, 4.2);
    b.mover(34.3, 3, 3, 2.7, 0, 5); b.starRow(35, 4.2, 5);
    b.ground(40, 50, 3); b.trash(41, 3); b.flyer(43, 3); b.bin(45, 3); b.hazard(47.5, 3); b.starArc(46.5, 5.2, 3);
    b.quiz(50, 'add'); b.o += 11;
    b.ground(50, 60); b.flag(51); b.log(53, 5); b.starRow(53, 0.6, 5); b.trash(59);
    b.plat(61, 0, 1); b.starArc(60, 1.4, 3);
    b.ground(63, 72); b.mush(64); b.plat(66, 4, 3); b.starRow(66, 5, 3); b.plat(70, 6, 3); b.star(70, 7); b.heart(71, 7); b.star(72, 7); b.plant(66.5); b.friend(68.5, 'hedgehog'); b.bin(70.5);
    b.mover(72.3, 1, 3, 1.7, 0, 4.5); b.mover(77.2, 0, 2.6, 0, 2, 4.5); b.starRow(73, 2.4, 3); b.star(78, 3.4);
    b.ground(80, 96); b.flag(81); b.trash(82); b.walker(83.5, 87); b.flyer(89); b.walker(91, 95); b.starRow(84, 2.6, 3); b.starRow(91, 2.6, 3);
    b.ground(96, 100, 1); b.plant(98, 1); b.ground(100, 104, 2); b.trash(102, 2); b.starArc(101, 3.4, 3);
    b.starArc(103, 2.6, 4);
    b.ground(106, 118); b.friend(107, 'fox'); b.log(109, 4); b.starRow(109, 0.6, 4); b.flyer(115); b.seed(117);
    b.starArc(117, 1.6, 4);
    b.quiz(120, 'sub'); b.o += 11;
    b.ground(120, 142); b.bin(120.8); b.mush(122.5); b.plat(124, 6, 5); b.starRow(124, 7, 5); b.trash(126); b.plant(128); b.friend(130, 'deer'); b.walker(132, 135); b.bin(136.5); b.goal(139.5);
  } },
  { name: 'La Granja', icon: '🐮', theme: 'farm', width: 108, build(b) {
    b.ground(0, 18); b.trash(4); b.friend(7, 'chick'); b.bin(10); b.starRow(4, 2.2, 3); b.plant(13); b.trash(15.5);
    b.starArc(17, 1.6, 4);
    b.ground(20, 32); b.walker(21.5, 26); b.mush(28.5); b.plat(30, 4, 3); b.friend(31, 'hen', 4); b.starRow(30, 5.4, 3);
    b.quiz(34, 'add'); b.o += 11;
    b.ground(34, 50); b.flag(35); b.seed(38); b.log(41, 4); b.starRow(41, 0.6, 4); b.trash(46.5); b.friend(48.5, 'pig');
    b.starArc(49, 1.6, 4);
    b.ground(52, 58, 1); b.trash(54, 1); b.ground(58, 64, 2); b.plant(61, 2); b.starRow(59, 3.2, 3);
    b.mover(64.3, 2, 3, 2.7, 0, 5); b.starRow(65, 3.4, 4);
    b.ground(70, 86); b.bin(71); b.hazard(74); b.starArc(73, 2.2, 3); b.friend(77.5, 'lamb'); b.mush(80.5); b.plat(82, 5, 3); b.star(82, 6); b.heart(83, 6); b.star(84, 6); b.trash(84.8);
    b.quiz(88, 'sub'); b.o += 11;
    b.ground(88, 108); b.flag(89); b.walker(91, 95); b.flyer(96.5); b.friend(99, 'cow'); b.trash(101); b.plant(102.5); b.bin(104); b.goal(106);
  } },
  { name: 'El Lago', icon: '🦆', theme: 'lake', width: 110, build(b) {
    b.ground(0, 14); b.trash(3); b.friend(6, 'frog'); b.trash(9); b.bin(12); b.starRow(3, 2.2, 3);
    b.plat(15.2, 0, 1.6); b.plat(18.2, 0, 1.6); b.starArc(14.5, 1.5, 6);
    b.ground(21, 34); b.plant(23); b.walker(25, 29.5); b.mush(31); b.plat(32, 5, 3); b.starRow(32, 6, 3);
    b.quiz(36, 'eng'); b.o += 11;
    b.ground(36, 52); b.flag(37); b.trash(39); b.friend(42, 'beaver'); b.log(45, 4); b.starRow(45, 0.6, 4); b.seed(50);
    b.plat(53.2, 0, 1.6); b.plat(56.2, 0.6, 1.6); b.plat(59.2, 0, 1.6); b.starArc(53, 1.8, 8);
    b.ground(62, 76); b.bin(63); b.hazard(66); b.starArc(65, 2.2, 3); b.plant(69); b.friend(72, 'raccoon'); b.trash(74.5);
    b.mover(76.3, 0, 3, 3, 0, 5); b.starRow(77, 1.6, 4);
    b.quiz(83, 'add'); b.o += 11;
    b.ground(83, 110); b.flag(84); b.trash(86); b.walker(88, 92); b.mush(94); b.plat(96, 5, 3); b.friend(97, 'mouse', 5); b.starRow(96, 6.4, 3); b.plant(100.5); b.bin(103); b.goal(107);
  } },
  { name: 'La Montaña', icon: '🏔️', theme: 'mountain', width: 124, build(b) {
    b.ground(0, 14); b.trash(3); b.friend(6, 'llama'); b.bin(9); b.trash(11.5); b.starRow(3, 2.2, 3);
    b.ground(14, 18, 1); b.ground(18, 22, 2); b.trash(20, 2); b.ground(22, 30, 3); b.plant(24, 3); b.walker(26, 29.5, 3); b.star(15, 2.2); b.star(19, 3.2); b.star(23, 4.2);
    b.mover(30.3, 3, 3, 2.7, 0, 5); b.starRow(31, 4.2, 5);
    b.ground(36, 46, 3); b.friend(38, 'goat', 3); b.mush(41.5, 3); b.plat(43, 6, 3); b.starRow(43, 7, 3);
    b.ground(46, 50, 2); b.ground(50, 54, 1); b.trash(52, 1);
    b.quiz(56, 'add'); b.o += 11;
    b.ground(56, 72); b.flag(57); b.seed(59); b.log(62, 4); b.starRow(62, 0.6, 4); b.friend(68, 'foal'); b.trash(70.5);
    b.starArc(71, 1.6, 4);
    b.ground(74, 88); b.bin(75); b.walker(77, 81.5); b.plant(83.5); b.mush(86); b.plat(87, 4.5, 2); b.starRow(87, 5.5, 2);
    b.mover(88.3, 1, 3, 1.7, 0, 4.5); b.starRow(89, 2.4, 3);
    b.ground(93, 100, 1); b.friend(95.5, 'chinchilla', 1); b.trash(98, 1);
    b.quiz(102, 'sub'); b.o += 11;
    b.ground(102, 124); b.flag(103); b.flyer(106); b.trash(108); b.hazard(111); b.starArc(110, 2.2, 3); b.bin(114); b.goal(120);
  } },
];

/* Tramos extra al final de cada mundo (más tramos y más bichos mientras más avanza).
   La meta original queda como bandera y la nueva meta va al final. */
const EXTRA_FRIENDS = { garden: ['monkey', 'parrot'], beach: ['seal', 'octopus', 'dolphin'], forest: ['bear', 'panda', 'koala'], farm: ['kangaroo', 'giraffe'], lake: ['flamingo', 'hippo'], mountain: ['penguin', 'lion', 'zebra', 'elephant'] };
function extendLevel(L, r, idx, x) {
  const R = rng(4321 + idx * 131), segs = 2 + idx, d = idx;
  if (L.goal) { L.flags.push({ x: L.goal.x, y: L.goal.y, on: false }); L.goal = null; }
  const pool = (EXTRA_FRIENDS[L.themeName] || []).slice();
  const friend = (x, h) => { const k = pool.shift(); if (k) r.friend(x, k, h); }; // sin repetir: si ya no quedan, no pone ninguno
  const S = [
    x => { r.ground(x, x + 12); r.walker(x + 1.5, x + 6.5); r.starRow(x + 2, 2.2, 3); r.trash(x + 8); friend(x + 10.6); if (d >= 2) { r.hazard(x + 10.2); r.starArc(x + 9.4, 2.2, 3); } return x + 12; },
    x => { r.plat(x + 1.2, 0, 1.6); r.plat(x + 4.2, 0, 1.6); r.starArc(x + 0.5, 1.5, 6); r.ground(x + 7, x + 15); r.plant(x + 9); r.bin(x + 12.5); if (d >= 3) r.flyer(x + 11); return x + 15; },
    x => { r.mover(x + 0.3, 0, 3, 3, 0, 5); r.starRow(x + 1, 1.6, 4); r.ground(x + 7, x + 18); friend(x + 9); r.trash(x + 12); r.seed(x + 15); if (d >= 1) r.walker(x + 13, x + 17.5); return x + 18; },
    x => { r.ground(x, x + 4, 1); r.ground(x + 4, x + 8, 2); r.trash(x + 6, 2); r.ground(x + 8, x + 12, 1); r.plant(x + 10, 1); r.star(x + 1, 2.2); r.star(x + 5, 3.2); r.star(x + 9, 2.2); r.ground(x + 12, x + 16); r.bin(x + 14); return x + 16; },
    x => { r.ground(x, x + 13); r.mush(x + 1.5); r.plat(x + 3, 5, 3); r.starRow(x + 3, 6, 2); r.heart(x + 5, 6); r.trash(x + 8.5); friend(x + 11); if (d >= 2) r.flyer(x + 7); return x + 13; },
    x => { r.ground(x, x + 13); r.log(x + 2, 4); r.starRow(x + 2, 0.6, 4); r.seed(x + 7.5); friend(x + 11.8); if (d >= 1) r.walker(x + 9, x + 12.5); else r.trash(x + 10); return x + 13; },
    x => { r.plat(x + 1, 0, 1); r.starArc(x, 1.4, 3); r.ground(x + 3, x + 14); r.hazard(x + 5.5); r.starArc(x + 4.5, 2.2, 3); r.trash(x + 8.5); friend(x + 11.5); if (d >= 4) r.hazard(x + 13.2); return x + 14; },
  ];
  // primero tramos fáciles; después se mezclan
  const order = [0, 5, 1, 2, 4, 3, 6]; for (let i = order.length - 1; i > 3; i--) { const j = 3 + Math.floor(R() * (i - 2)); [order[i], order[j]] = [order[j], order[i]]; }
  const quizAt = new Set(idx >= 4 ? [Math.floor(segs / 3), Math.floor(segs * 2 / 3)] : [Math.floor(segs / 2)]);
  const qKinds = ['eng', idx % 2 ? 'add' : 'sub', 'eng'];
  let qi = 0;
  for (let i = 0; i < segs; i++) {
    if (quizAt.has(i)) { r.ground(x, x + 2); r.quiz(x + 2, qKinds[qi++ % qKinds.length]); r.ground(x + 11, x + 13); x += 13; }
    x = S[order[i % order.length]](x);
  }
  r.ground(x, x + 14); r.flag(x + 1); r.trash(x + 4); r.bin(x + 7); r.goal(x + 11);
  return x + 14;
}

function makeLevel(idx) {
  const def = LEVELS[idx];
  const L = { idx, name: def.name, theme: THEMES[def.theme], themeName: def.theme, width: def.width * T, solids: [], plats: [], movers: [], stars: [], hearts: [], walkers: [], flyers: [], hazards: [], friends: [], mushes: [], flags: [], signs: [], decor: [], trash: [], bins: [], plants: [], seeds: [], quizzes: [], goal: null, total: 0, amb: { flies: [], bugs: [], gaps: [] } };
  const Y = h => G - h * T;
  const r = {
    ground(x1, x2, h = 0) { L.solids.push({ x: x1 * T, y: Y(h), w: (x2 - x1) * T, h: VIEW_H - Y(h) + 400, kind: 'ground' }); },
    log(x, w, h = 0) { L.solids.push({ x: x * T, y: Y(h) - 124, w: w * T, h: 44, kind: 'log', base: Y(h) }); },
    plat(x, h, w) { L.plats.push({ x: x * T, y: Y(h), w: w * T, h: 22 }); },
    mover(x, h, w, ax, ay, period) { L.movers.push({ bx: x * T, by: Y(h), x: x * T, y: Y(h), w: w * T, h: 22, ax: ax * T, ay: -ay * T, period, dx: 0, dy: 0 }); },
    star(x, h) { L.stars.push({ x: (x + 0.5) * T, y: Y(h), got: false, ph: x }); },
    starRow(x, h, n) { for (let i = 0; i < n; i++) r.star(x + i, h); },
    starArc(x, h, n) { for (let i = 0; i < n; i++) r.star(x + i, h + Math.sin(i / (n - 1) * Math.PI) * 0.9); },
    heart(x, h) { L.hearts.push({ x: (x + 0.5) * T, y: Y(h), got: false }); },
    walker(x1, x2, h = 0) { L.walkers.push({ x: (x1 + 0.5) * T, min: x1 * T + 26, max: x2 * T - 26, y: Y(h), dir: 1, asleep: false }); },
    flyer(x, h = 0) { L.flyers.push({ x: (x + 0.5) * T, gy: Y(h), ph: x }); },
    hazard(x, h = 0) { L.hazards.push({ x: (x + 0.5) * T, y: Y(h) }); },
    friend(x, kind, h = 0) { L.friends.push({ x: (x + 0.5) * T, y: Y(h), kind, greeted: false, hop: 0, follow: false, fx: 0, fy: 0, dirx: 1, walk: 0, mv: 0 }); },
    mush(x, h = 0) { L.mushes.push({ x: (x + 0.5) * T, y: Y(h), done: false, g: 0, sq: 0 }); },
    spring(x, h = 0) { r.mush(x, h); },
    flag(x, h = 0) { L.flags.push({ x: (x + 0.5) * T, y: Y(h), on: false }); },
    sign(x, icon, word, h = 0) { L.signs.push({ x: (x + 0.5) * T, y: Y(h), icon, word }); },
    goal(x, h = 0) { L.goal = { x: (x + 0.5) * T, y: Y(h) }; },
    // --- cuidar el planeta ---
    trash(x, h = 0) { L.trash.push({ x: (x + 0.5) * T, y: Y(h), kind: (L.trash.length + idx) % 6, got: false }); },
    bin(x, h = 0) { L.bins.push({ x: (x + 0.5) * T, y: Y(h), sq: 0, count: 0 }); },
    plant(x, h = 0) { L.plants.push({ x: (x + 0.5) * T, y: Y(h), done: false, g: 0, c: L.plants.length + idx }); },
    seed(x, h = 0) { L.seeds.push({ x: (x + 0.5) * T, y: Y(h), done: false, g: 0 }); },
    // --- reto del búho: islita de 9 baldosas, 3 bloques con respuestas y una puerta mágica ---
    quiz(x, kind) {
      r.ground(x, x + 9);
      const gate = { x: (x + 7.4) * T, y: -300, w: 0.9 * T, h: G + 300, kind: 'gate', open: 0 };
      const n = L.quizzes.length, need = idx === 0 && n === 0 ? 1 : idx >= 4 ? 3 : 2; // primer reto del juego: 1 pregunta; después 2, y 3 en los últimos mundos
      const q = { kind, owl: { x: (x + 0.9) * T, y: G }, gate, state: 'idle', blocks: [], q: null, n, need, got: 0, used: [], bump: 0, wrongs: 0 };
      for (let i = 0; i < 3; i++) { const bl = { x: (x + 2.3 + i * 1.55) * T - 27, y: G - 168, w: 54, h: 54, kind: 'qblock', quiz: q, i, bump: 0, wrong: false, right: false }; q.blocks.push(bl); L.solids.push(bl); }
      L.solids.push(gate); L.quizzes.push(q);
      r.starArc(x + 8.5, 1.6, 3);
    },
  };
  const b = { o: 0 };
  for (const k in r) b[k] = (x, ...a) => { if (k === 'ground' || k === 'walker') a[0] += b.o; return r[k](x + b.o, ...a); };
  def.build(b);
  L.width = extendLevel(L, r, idx, def.width + b.o) * T;
  L.total = L.trash.length + L.plants.length + L.seeds.length + L.friends.length;
  // Decoración automática sobre el suelo (sin tapar las cosas con las que se juega)
  const R = rng(1234 + idx * 77), kinds = L.theme.decor;
  const busy = [].concat(L.trash, L.bins, L.plants, L.seeds, L.friends, L.mushes, L.signs, L.flags, L.hazards, L.quizzes.map(q => q.owl)).map(o => o.x);
  const grounds = L.solids.filter(s => s.kind === 'ground').sort((a, c) => a.x - c.x);
  for (const s of grounds) {
    for (let x = s.x + 30; x < s.x + s.w - 30; x += 60 + R() * 110) {
      const k = kinds[Math.floor(R() * kinds.length)], rr = R();
      if (!BACK_DECOR[k] && busy.some(bx => Math.abs(bx - x) < 34)) continue;
      L.decor.push({ x, y: s.y, kind: k, r: rr });
    }
    for (let x = s.x + 80; x < s.x + s.w - 40; x += 380 + R() * 300) L.amb.bugs.push({ x, y: s.y, ph: R() * 9 });
  }
  // Vida que se mueve: mariposas en el aire y peces saltando en el agua
  for (let x = 300; x < L.width; x += 260 + R() * 180) L.amb.flies.push({ x, y: G - 150 - R() * 130, ph: R() * 20, i: L.amb.flies.length });
  for (let i = 1; i < grounds.length; i++) {
    const a = grounds[i - 1], c = grounds[i], gx = a.x + a.w, gw = c.x - gx;
    if (gw >= T * 1.5) L.amb.gaps.push({ x: gx + gw / 2, w: gw, ph: R() * 5, per: 3 + R() * 2.5, dir: R() < 0.5 ? -1 : 1, was: false });
  }
  return L;
}


/* ---------------- Estado del juego ---------------- */
let state = 'title', L = null, P = null, cam = { x: 0 }, parts = [], time = 0, hearts = MAX_HEARTS, starsGot = 0, ecoDone = 0, winT = 0, winShown = false, toast = null;

// Acciones: dur = cuánto dura, at = momento en que "pasa" lo bueno, dist = a qué distancia se para del objetivo
const ACT = {
  pickup: { dur: 0.5, at: 0.28, dist: 30, spr: 'pickup' }, toss: { dur: 0.7, at: 0.3, dist: 54, spr: 'toss' },
  water: { dur: 1.5, at: 1.1, dist: 74, spr: 'water' }, plant: { dur: 1.3, at: 0.8, dist: 34, spr: 'plant' },
  pet: { dur: 1.3, at: 0.45, dist: 64, spr: 'pet' }, wmush: { dur: 1.5, at: 1.1, dist: 74, spr: 'water' }, thumbs: { dur: 0.7, spr: 'thumbs' }, wave: { dur: 0.9, spr: 'wave' },
};
const HINT = { pickup: '✋', toss: '♻️', water: '💧', plant: '🌱', pet: '💗', ask: '🔊', wmush: '💧' };
let cards = [], followers = [], said = {}, idleT = 0;

function newPlayer(x, bottom) {
  return { x, y: bottom - STAND_H, w: 30, h: STAND_H, vx: 0, vy: 0, face: 1, faceVis: 1, grounded: false, crouch: false, coyote: 0, jbuf: 0, act: null, bag: 0, hurtT: 0, inv: 0, standOn: null, dist: 0, sq: 0, stepT: 0, sprung: false, safeX: x, safeY: bottom, cpX: x, cpY: bottom, needReset: false, trail: [] };
}

/* --- Tarjetita con la palabra en español e inglés --- */
function wordCard(x, y, pic, es, en) { cards = cards.filter(c => Math.abs(c.x - x) > 10); cards.push({ x, y, pic, es, en, t: 3.2 }); }
function teach(kind, x, y) {
  const w = WORDS[kind]; if (!w) return; wordCard(x, y, kind, w[0], w[1]);
  if (FH[kind]) { save.met = save.met || []; if (save.met.indexOf(kind) < 0) { save.met.push(kind); persist(); } }
  said.ei = (said.ei || 0) + 1; speak((said.ei <= 2 ? ['eningles'] : []).concat(['en_' + kind]), true); talkCD = 6;
}

/* --- Retos del búho --- */
const ri = n => Math.floor(Math.random() * n);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickNew(list, used) { const f = list.filter(k => used.indexOf(k) < 0); const src = f.length ? f : list; return src[ri(src.length)]; }
function makeQuestion(q) {
  const lv = L.idx, used = L.usedQ || (L.usedQ = []);
  let kind = q.kind;
  if (kind === 'eng') { // inglés: animalitos; desde el 2º mundo también números; desde el 3º, colores
    const kinds = lv === 0 ? ['eng'] : lv === 1 ? ['eng', 'num'] : ['eng', 'num', 'col'];
    kind = kinds[(q.got + q.n + lv) % kinds.length];
  } else if (lv >= 2 && q.got > 0) kind = ri(2) ? 'add' : 'sub';
  // frutas en inglés: desde el 3er mundo, sólo las que ya vio en el minijuego
  const seenFr = (save.fruits || []).filter(k => FRUTAS[k]);
  if (kind === 'eng' && lv >= 2 && seenFr.length >= 3 && ri(2)) {
    const ans = pickNew(seenFr, used); used.push(ans);
    const all = Object.keys(FRUTAS), opts = [ans];
    while (opts.length < 3) { const k = ri(3) ? seenFr[ri(seenFr.length)] : all[ri(all.length)]; if (opts.indexOf(k) < 0) opts.push(k); }
    return { kind: 'eng', ans, opts: shuffle(opts) };
  }
  if (kind === 'eng') {
    // sólo animalitos que ya aparecieron antes del búho (o que conoció en otros mundos)
    const before = L.friends.filter(f => f.x < q.owl.x).map(f => f.kind), met = (save.met || []).filter(k => FH[k]);
    const known = [...new Set(before.concat(met))];
    const cands = before.length ? [...new Set(before.concat(lv > 0 ? met : []))] : known.length ? known : Object.keys(FH);
    const ans = pickNew(cands, used); used.push(ans);
    const src = known.length > 2 ? known : Object.keys(FH);
    const opts = [ans]; let t = 0; while (opts.length < 3 && t++ < 99) { const k = (t < 40 ? src : Object.keys(FH))[ri((t < 40 ? src : Object.keys(FH)).length)]; if (opts.indexOf(k) < 0) opts.push(k); }
    return { kind: 'eng', ans, opts: shuffle(opts) };
  }
  if (kind === 'col') {
    const all = Object.keys(COLS), ans = pickNew(all, used); used.push(ans);
    const opts = [ans]; while (opts.length < 3) { const k = all[ri(all.length)]; if (opts.indexOf(k) < 0) opts.push(k); }
    return { kind: 'col', ans, opts: shuffle(opts) };
  }
  if (kind === 'num') {
    const max = lv < 3 ? 5 : 10, all = []; for (let i = 1; i <= max; i++) all.push(i);
    const ans = pickNew(all, used); used.push(ans);
    const opts = [ans]; while (opts.length < 3) { const k = 1 + ri(max); if (opts.indexOf(k) < 0) opts.push(k); }
    return { kind: 'num', ans, opts: shuffle(opts) };
  }
  let a, b, ans, t = 0;
  do {
    if (kind === 'add') { const max = lv === 0 ? 5 : lv === 1 ? 7 : 9; a = 1 + ri(max - 1); b = 1 + ri(max - a); ans = a + b; }
    else { const max = lv < 2 ? 6 : 9; a = 2 + ri(max - 1); b = 1 + ri(a - 1); ans = a - b; }
  } while (used.indexOf(kind + a + '_' + b) >= 0 && t++ < 40);
  used.push(kind + a + '_' + b);
  const opts = [ans]; let tries = 0;
  while (opts.length < 3 && tries++ < 50) { const d = ans + (ri(2) ? 1 : -1) * (1 + ri(2)); if (d >= 0 && d <= 10 && opts.indexOf(d) < 0) opts.push(d); }
  while (opts.length < 3) { const d = ri(11); if (opts.indexOf(d) < 0) opts.push(d); }
  return { kind, a, b, ans, opts: shuffle(opts) };
}
function wordVoice(Q) { // la palabra sola (para enseñarla)
  if (Q.kind === 'eng') return FRUTAS[Q.ans] ? ['fe_' + frBase(Q.ans)] : ['en_' + Q.ans];
  if (Q.kind === 'col') return ['col_' + Q.ans];
  if (Q.kind === 'num') return ['num_' + Q.ans];
  return VOZ_NUEVA.has('ans_' + Q.ans) ? ['ans_' + Q.ans] : ['n' + Q.ans];
}
function questionVoice(Q) {
  if (Q.kind === 'eng' && FRUTAS[Q.ans]) return ['en_find', 'fe_' + frBase(Q.ans)];
  if (Q.kind === 'eng') return VOZ_NUEVA.has('ef_' + Q.ans) ? ['ef_' + Q.ans] : ['en_find', 'en_' + Q.ans];
  if (Q.kind === 'col') return ['fc_find', 'col_' + Q.ans];
  if (Q.kind === 'num') return ['fn_find', 'num_' + Q.ans];
  const k = (Q.kind === 'add' ? 'qa_' : 'qs_') + Q.a + '_' + Q.b;
  return VOZ_NUEVA.has(k) ? [k] : ['cuanto', 'n' + Q.a, Q.kind === 'add' ? 'mas' : 'menos', 'n' + Q.b];
}
function askQuiz(q) {
  q.state = 'ask'; q.Q = makeQuestion(q);
  const v = []; if (!said.puerta) { said.puerta = 1; v.push('q_puerta'); }
  if (q.Q.kind === 'eng' && !said.busca) { said.busca = 1; v.push('q_busca'); }
  speak(v.concat(questionVoice(q.Q)), true);
}
function hitBlock(bl) {
  const q = bl.quiz; bl.bump = 1;
  if (q.state !== 'ask' || bl.wrong) { play('boing', 0.25); return; }
  const Q = q.Q, en = Q.kind === 'eng' || Q.kind === 'col' || Q.kind === 'num';
  if (Q.opts[bl.i] === Q.ans) {
    bl.right = true; q.got++; q.bump = 1;
    addStars(q.got >= q.need ? 3 : 1, bl.x + bl.w / 2, bl.y); burst(bl.x + bl.w / 2, bl.y - 10, 'heart', 8, '#ff7fb6'); play(q.got >= q.need ? 'win' : 'star', 0.5);
    speak(en ? ['en_greatjob'].concat(wordVoice(Q)) : [pick(['p1', 'p2', 'p3', 'p5'])].concat(wordVoice(Q)), true); talkCD = 6;
    if (Q.kind === 'eng') wordCard(bl.x + bl.w / 2, bl.y - 90, Q.ans, WORDS[Q.ans][0], WORDS[Q.ans][1]);
    if (Q.kind === 'col') wordCard(bl.x + bl.w / 2, bl.y - 90, COLS[Q.ans][3], COLS[Q.ans][0], COLS[Q.ans][1]);
    if (q.got >= q.need) q.state = 'done'; else { q.state = 'next'; q.nextT = 2.6; }
  } else {
    // equivocada: se muestra cuál era, se dice la respuesta y viene OTRA pregunta (no se puede pasar descartando)
    bl.wrong = true; q.wrongs++; sfx.hurt();
    const ok = q.blocks.find(x => Q.opts[x.i] === Q.ans); if (ok) ok.reveal = true;
    speak(['e_casi'].concat(wordVoice(Q)), true);
    if (ok && Q.kind === 'eng') wordCard(ok.x + ok.w / 2, ok.y - 90, Q.ans, WORDS[Q.ans][0], WORDS[Q.ans][1]);
    if (ok && Q.kind === 'col') wordCard(ok.x + ok.w / 2, ok.y - 90, COLS[Q.ans][3], COLS[Q.ans][0], COLS[Q.ans][1]);
    q.state = 'next'; q.nextT = 3.4;
  }
}
function startLevel(i) {
  shutUp(); cards = []; followers = []; said = {};
  L = makeLevel(i); P = newPlayer(2 * T, G); cam.x = 0; parts = []; time = 0; hearts = MAX_HEARTS; starsGot = 0; ecoDone = 0; winT = 0; winShown = false; toast = null;
  jumpPressed = wavePressed = greetPressed = false; for (const k in keys) keys[k] = false;
  document.getElementById('lvlName').textContent = (i + 1) + ' · ' + L.name;
  updateHud(); showIntro();
}
function updateHud() {
  let h = ''; for (let i = 0; i < MAX_HEARTS; i++) h += '<span class="' + (i < hearts ? '' : 'off') + '">❤️</span>';
  document.getElementById('hearts').innerHTML = h;
  document.getElementById('stars').textContent = starsGot;
  document.getElementById('tossed').textContent = L.tossed || 0;
  document.getElementById('eco').textContent = ecoDone + '/' + L.total;
  document.getElementById('ecoFill').style.width = (L.total ? ecoDone / L.total * 100 : 0) + '%';
}
function say(text, dur) { toast = { text, t: dur || 2 }; }

function burst(x, y, kind, n, color) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 180; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.5 + Math.random() * 0.5, max: 1, kind, color: color || '#ffd84d', size: 4 + Math.random() * 5, rot: Math.random() * 6 }); }
}
function confetti() {
  const cols = ['#ff7fb6', '#ffd84d', '#7be0c3', '#7fb8ff', '#c69bff'];
  for (let i = 0; i < 90; i++) parts.push({ x: cam.x + Math.random() * VIEW_W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160, life: 4, max: 4, kind: 'conf', color: cols[i % 5], size: 6 + Math.random() * 6, rot: Math.random() * 6, nograv: true });
}
function addStars(n, x, y) { starsGot += n; burst(x, y, 'star', 6 + n * 2); updateHud(); }
function addEco(n, x, y) {
  ecoDone += n; burst(x, y, 'heart', 6, '#5fd08a'); burst(x, y, 'star', 6); updateHud();
  if (ecoDone >= L.total) { say(L.theme.happy + ' 🌍', 3.5); confetti(); setTimeout(() => chat(['p_todo'], 1, 8), 2200); }
}

function canStand() {
  if (!P.crouch) return true;
  const box = { x: P.x, y: P.y - (STAND_H - CROUCH_H), w: P.w, h: STAND_H };
  return !L.solids.some(s => overlap(box, s));
}
function setCrouch(v) {
  if (v && !P.crouch) { P.crouch = true; P.y += STAND_H - CROUCH_H; P.h = CROUCH_H; }
  else if (!v && P.crouch && canStand()) { P.crouch = false; P.y -= STAND_H - CROUCH_H; P.h = STAND_H; }
}
function respawn(x, bottom) {
  P.crouch = false; P.h = STAND_H; P.x = x; P.y = bottom - STAND_H; P.vx = P.vy = 0; P.inv = 1.8; P.hurtT = 0; P.standOn = null; P.act = null; P.trail = [];
  burst(x + P.w / 2, bottom - 50, 'dust', 12, '#ffffff');
}
function hurt(srcX) {
  if (P.inv > 0 || state !== 'play') return;
  hearts--; updateHud(); sfx.hurt();
  P.hurtT = 0.7; P.inv = 2.2; P.act = null; P.vx = (P.x + P.w / 2 < srcX ? -1 : 1) * 200; P.vy = -380; P.sprung = true;
  burst(P.x + P.w / 2, P.y + 30, 'dust', 8, '#ffffff');
  if (hearts <= 0) P.needReset = true;
}

// ¿Qué puede ayudar ahora? El objetivo más cercano: basura, basurero, planta, hoyito o animalito.
function findTarget() {
  if (!P || !P.grounded || P.crouch) return null;
  const cx = P.x + P.w / 2, fy = P.y + P.h; let best = null, bd = 1e9;
  const chk = (o, type, ok) => { if (!ok) return; const d = Math.abs(o.x - cx); if (d < 84 && Math.abs(o.y - fy) < 40 && d < bd) { bd = d; best = { type, o }; } };
  for (const t of L.trash) chk(t, 'pickup', !t.got);
  for (const b of L.bins) chk(b, 'toss', P.bag > 0);
  for (const p of L.plants) chk(p, 'water', !p.done);
  for (const s of L.seeds) chk(s, 'plant', !s.done);
  for (const f of L.friends) chk(f, 'pet', !f.greeted);
  for (const q of L.quizzes) chk(q.owl, 'ask', q.state === 'ask');
  for (const m of L.mushes) chk(m, 'wmush', !m.done);
  return best;
}
function doEffect(a) {
  const o = a.o;
  if (a.type === 'pickup') {
    o.got = true; P.bag++; play('pickup', 0.7, 1.2); burst(o.x, o.y - 12, 'dust', 6, '#ffffff');
    if (!said.pickup) { said.pickup = 1; wordCard(o.x, o.y - 120, '🗑️', 'Recoger', 'Pick it up!'); speak(['en_pickup'], true); talkCD = 5; }
  }
  else if (a.type === 'toss') {
    const n = P.bag; P.bag = 0; o.sq = 1; o.count += n; L.tossed = (L.tossed || 0) + n; o.pop = 1; play('bin', 0.7);
    for (let i = 0; i < n; i++) parts.push({ x: P.x + P.w / 2 + P.face * 40, y: P.y + 10, vx: P.face * (30 + i * 25), vy: -260 - i * 40, life: 0.5, max: 0.5, kind: 'dust', color: '#e9e4d8', size: 6, rot: 0 });
    addEco(n, o.x, o.y - 60); say('🗑️ ¡' + L.tossed + (L.tossed === 1 ? ' basura' : ' basuras') + ' al basurero!', 1.6);
    if (!said.recycle) { said.recycle = 1; wordCard(o.x, o.y - 140, '♻️', 'Reciclar', 'Recycle!'); talkCD = 5; setTimeout(() => speak(['en_recycle'], true), 450); } else praise(0.45);
  }
  else if (a.type === 'water') { o.done = true; play('grow', 0.7); addEco(1, o.x, o.y - 40); const n = FLOWERS[o.c % 4]; setTimeout(() => teach(n, o.x, o.y - 130), 500); }
  else if (a.type === 'plant') { o.done = true; play('grow', 0.7); addEco(1, o.x, o.y - 30); if (!said.plant) { said.plant = 1; wordCard(o.x, o.y - 160, '🌳', 'Plantar un árbol', 'Plant a tree!'); speak(['en_plant'], true); talkCD = 5; } else praise(0.5); }
  else if (a.type === 'wmush') { o.done = true; play('grow', 0.7); addStars(1, o.x, o.y - 40); if (!said.hongo2) { said.hongo2 = 1; setTimeout(() => chat(['h_crecio'], 1, 6), 700); } }
  else if (a.type === 'pet') {
    o.greeted = true; o.hop = 1.4; play('pet', 0.7, 1.8); burst(o.x, o.y - 50, 'heart', 10, '#ff6fa5'); addEco(1, o.x, o.y - 60);
    teach(o.kind, o.x, o.y - (FH[o.kind] || 56) - 70);
    o.fx = o.x; o.fy = o.y; setTimeout(() => { if (L && L.friends.indexOf(o) >= 0 && !o.follow) { o.follow = true; followers.push(o); if (!said.amigo) { said.amigo = 1; chat(['amigo'], 1, 6); } } }, 1500);
  }
}

function step(dt) {
  time += dt;
  const p = P;
  for (const m of L.movers) { const a = (1 - Math.cos(time * 2 * Math.PI / m.period)) / 2, nx = m.bx + m.ax * a, ny = m.by + m.ay * a; m.dx = nx - m.x; m.dy = ny - m.y; m.x = nx; m.y = ny; }
  if (p.standOn && p.standOn.dx !== undefined) { p.x += p.standOn.dx; p.y = p.standOn.y - p.h; }

  const win = state === 'win';
  const ctl = !win && p.hurtT <= 0;
  p.hurtT -= dt; p.inv -= dt; p.coyote -= dt; p.jbuf -= dt;
  if (p.needReset && p.hurtT <= 0) { p.needReset = false; hearts = MAX_HEARTS; updateHud(); respawn(p.cpX, p.cpY); say('¡Tú puedes! 💪'); speak(['e_vamos'], true); talkCD = 6; }

  // --- Entrada ---
  setCrouch(ctl && keys.down && p.grounded && !p.act);
  let dir = ctl ? (keys.right ? 1 : 0) - (keys.left ? 1 : 0) : 0;
  if (wavePressed) {
    wavePressed = false;
    if (ctl && p.grounded && !p.crouch && !p.act) {
      const tg = findTarget();
      if (tg && tg.type === 'ask') { p.act = { type: 'wave', t: 0 }; p.face = tg.o.x >= p.x + p.w / 2 ? 1 : -1; const q = L.quizzes.find(z => z.owl === tg.o); speak(questionVoice(q.Q), true); }
      else if (tg) { p.act = { type: tg.type, o: tg.o, t: 0, done: false }; p.face = tg.o.x >= p.x + p.w / 2 ? 1 : -1; if (tg.type === 'water' || tg.type === 'wmush') play('water', 0.7); }
      else { p.act = { type: 'wave', t: 0 }; sfx.wave(); chat(['en_hello'], 0.5, 5); }
    }
  }
  if (greetPressed) { // saludar: siempre saluda con la mano, haya o no algo cerca
    greetPressed = false;
    if (ctl && p.grounded && !p.crouch && !p.act) { p.act = { type: 'wave', t: 0 }; sfx.wave(); chat(['en_hello'], 1, 3); }
  }
  if (p.act) {
    const a = p.act, D = ACT[a.type]; a.t += dt;
    if (a.o && D.dist) { let want = a.o.x - p.face * D.dist - p.w / 2; const s = p.standOn; if (s && s.kind === 'ground') want = clamp(want, s.x + 2, s.x + s.w - p.w - 2); p.x += (want - p.x) * Math.min(1, dt * 12); }
    if (a.type === 'water' && a.t > 0.25 && a.t < D.at && Math.random() < dt * 40) parts.push({ x: p.x + p.w / 2 + p.face * (58 + Math.random() * 14), y: p.y + p.h - 46, vx: p.face * 20, vy: 40, life: 0.35, max: 0.35, kind: 'dust', color: '#6ec6f0', size: 3, rot: 0 });
    if (a.o && !a.done && a.t >= D.at) { a.done = true; doEffect(a); }
    if (a.type === 'wave' && (dir || jumpPressed) && a.t > 0.25) p.act = null;
    else if (a.t >= D.dur) p.act = a.type === 'toss' ? { type: 'thumbs', t: 0 } : null;
    if (p.act) { dir = 0; jumpPressed = false; }
  }
  if (dir) p.face = dir;
  if (state === 'play' && !dir && !keys.jump && !p.act && p.hurtT <= 0) idleT += dt; else idleT = 0;
  if (idleT > 15 && !vozCur) { idleT = -10; chat([pick(['i1', 'i2', 'i3'])], 1, 6); }
  if (p.hurtT <= 0) {
    const target = dir * (p.crouch ? CROUCH_SPEED : SPEED), acc = (p.grounded ? 2400 : 1600) * dt;
    p.vx += clamp(target - p.vx, -acc, acc);
  }
  if (jumpPressed) { jumpPressed = false; p.jbuf = 0.14; }
  if (p.jbuf > 0 && p.coyote > 0 && ctl && !p.act) {
    setCrouch(false);
    if (!p.crouch) { p.vy = -JUMP_V; p.coyote = 0; p.jbuf = 0; p.sprung = false; p.sq = -0.2; sfx.jump(); burst(p.x + p.w / 2, p.y + p.h, 'dust', 4, '#ffffff'); }
  }
  if (!keys.jump && !p.sprung && p.vy < -300) p.vy = -300;
  if (win && p.grounded) { p.vy = -430; p.sq = -0.15; }
  p.vy = Math.min(p.vy + GRAV * dt, 1000);

  // --- Movimiento horizontal ---
  p.x += p.vx * dt;
  for (const s of L.solids) if (overlap(p, s)) {
    if (p.x + p.w / 2 < s.x + s.w / 2) p.x = s.x - p.w; else p.x = s.x + s.w;
    p.vx = 0;
  }
  p.x = clamp(p.x, 0, L.width - p.w);

  // --- Movimiento vertical ---
  const prevBottom = p.y + p.h, wasAir = !p.grounded, fallV = p.vy;
  p.y += p.vy * dt; p.grounded = false; p.standOn = null; let headHit = null;
  for (const s of L.solids) if (overlap(p, s)) {
    if (p.vy > 0) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; p.standOn = s; }
    else { p.y = s.y + s.h; p.vy = 0; if (s.kind === 'qblock') { const d = Math.abs(s.x + s.w / 2 - (p.x + p.w / 2)); if (!headHit || d < headHit.d) headHit = { s, d }; } }
  }
  if (headHit && state === 'play') hitBlock(headHit.s);
  if (p.vy >= 0) for (const pl of L.plats.concat(L.movers)) {
    if (p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2 && prevBottom <= pl.y + Math.abs(pl.dy || 0) + 3 && p.y + p.h >= pl.y) { p.y = pl.y - p.h; p.vy = 0; p.grounded = true; p.standOn = pl; }
  }
  if (p.grounded) {
    p.coyote = 0.13; p.sprung = false;
    if (wasAir && fallV > 350) { p.sq = Math.min(0.28, fallV / 3200); burst(p.x + p.w / 2, p.y + p.h, 'dust', 5, '#ffffff'); }
    const s = p.standOn, cx = p.x + p.w / 2;
    if (s.kind === 'ground' && cx > s.x + 44 && cx < s.x + s.w - 44 && p.hurtT <= 0) { p.safeX = p.x; p.safeY = s.y; }
  }
  // --- Animación: pasos por distancia, polvito, estirar y aplastar ---
  if (p.grounded && Math.abs(p.vx) > 30) {
    p.dist += Math.abs(p.vx) * dt; p.stepT -= dt;
    if (p.stepT <= 0 && !p.crouch) { p.stepT = 0.26; parts.push({ x: p.x + p.w / 2 - p.face * 12, y: p.y + p.h - 3, vx: -p.face * 30, vy: -30, life: 0.35, max: 0.35, kind: 'dust', color: 'rgba(255,255,255,.8)', size: 3 + Math.random() * 2, rot: 0 }); }
  }
  p.sq += (0 - p.sq) * Math.min(1, dt * 11);
  p.faceVis += (p.face - p.faceVis) * Math.min(1, dt * 20);

  // --- Caída al agua: vuelve sin castigo ---
  if (p.y > VIEW_H + 80) { sfx.splash(); burst(p.x, VIEW_H - 20, 'dust', 14, L.theme.waterLight); respawn(p.safeX, p.safeY); }

  if (!win) entities(dt, prevBottom);
  for (const o of L.plants) if (o.done) o.g = Math.min(1, o.g + dt * 1.1);
  for (const o of L.seeds) if (o.done) o.g = Math.min(1, o.g + dt * 0.8);
  for (const o of L.bins) o.sq = Math.max(0, o.sq - dt * 3);
  updateLife(dt);

  // --- Partículas ---
  for (const q of parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (!q.nograv) q.vy += 500 * dt; else q.x += Math.sin(time * 5 + q.rot) * 40 * dt; q.rot += dt * 5; }
  parts = parts.filter(q => q.life > 0);
  if (toast && (toast.t -= dt) <= 0) toast = null;

  // --- Cámara ---
  const tx = clamp(p.x + p.w / 2 - VIEW_W * 0.42 + p.face * 40, 0, Math.max(0, L.width - VIEW_W));
  cam.x += (tx - cam.x) * Math.min(1, dt * 5);
  if (!isFinite(cam.x)) { if (!window.__camErr) { window.__camErr = { tx, dt, px: p.x, py: p.y, face: p.face, w: L.width, vw: VIEW_W }; console.error('cam NaN', JSON.stringify(window.__camErr)); } cam.x = isFinite(tx) ? tx : 0; }
}

// Retos, amigos que te siguen, tarjetitas y peces que saltan
function updateLife(dt) {
  const p = P, cx = p.x + p.w / 2, foot = p.y + p.h, lt = p.trail[p.trail.length - 1];
  if (!lt || Math.hypot(lt.x - cx, lt.y - foot) > 5) { p.trail.push({ x: cx, y: foot }); if (p.trail.length > 500) p.trail.shift(); }
  followers.forEach((f, k) => {
    const idx = p.trail.length - 1 - (k + 1) * 15; let tx, ty;
    if (idx >= 0) { tx = p.trail[idx].x; ty = p.trail[idx].y; } else { tx = cx - p.face * (k + 1) * 44; ty = foot; }
    const dx = tx - f.fx; if (Math.abs(dx) > 1.5) f.dirx = dx > 0 ? 1 : -1;
    f.mv += ((Math.abs(dx) > 3 ? 1 : 0) - f.mv) * Math.min(1, dt * 8);
    f.fx += dx * Math.min(1, dt * 7); f.fy += (ty - f.fy) * Math.min(1, dt * 9); f.walk += dt * 13 * f.mv;
  });
  for (const q of L.quizzes) {
    if (q.state === 'idle' && state === 'play' && cx > q.owl.x - 60) askQuiz(q);
    if (q.state === 'next' && (q.nextT -= dt) <= 0) {
      for (const bl of q.blocks) { bl.wrong = bl.right = bl.reveal = false; bl.bump = 1; }
      q.state = 'ask'; q.Q = makeQuestion(q); speak(questionVoice(q.Q), true);
    }
    for (const bl of q.blocks) bl.bump = Math.max(0, bl.bump - dt * 4);
    q.bump = Math.max(0, q.bump - dt * 0.8);
    if (q.state === 'done' && q.gate.open < 1) {
      if (!q.opened) { q.opened = true; q.delay = 0.7; }
      if ((q.delay -= dt) <= 0) {
        if (q.gate.open === 0) { play('grow', 0.7); burst(q.gate.x + q.gate.w / 2, G - 120, 'star', 16); }
        q.gate.open = Math.min(1, q.gate.open + dt * 0.9); q.gate.y = -300 + ease(q.gate.open) * (G + 330);
        if (q.gate.open >= 1) { const i = L.solids.indexOf(q.gate); if (i >= 0) L.solids.splice(i, 1); }
      }
    }
  }
  for (const c of cards) c.t -= dt; cards = cards.filter(c => c.t > 0);
  talkCD -= dt;
  if (state === 'play' && talkCD <= 0 && !vozCur) {
    const near = (arr, ok) => arr.some(o => ok(o) && o.x > cx - 20 && o.x < cx + 260);
    const tips = [['h_basura', L.trash, o => !o.got], ['h_flor', L.plants, o => !o.done], ['h_amigo', L.friends, o => !o.greeted], ['h_hongo', L.mushes, o => !o.done], ['h_arbol', L.seeds, o => !o.done], ['h_basurero', L.bins, () => p.bag > 0]];
    for (const [k, arr, ok] of tips) if (!said[k] && near(arr, ok)) { said[k] = 1; chat([k], 1, 6); break; }
  }
  for (const g of L.amb.gaps) {
    const ph = (time + g.ph) % g.per, jump = ph < 1.1;
    if (jump !== g.was && Math.abs(g.x - cx) < VIEW_W) { const sx = g.x + (jump ? -1 : 1) * g.dir * 34; for (let i = 0; i < 6; i++) parts.push({ x: sx, y: G + 44, vx: (Math.random() - 0.5) * 120, vy: -120 - Math.random() * 140, life: 0.5, max: 0.5, kind: 'dust', color: L.theme.waterLight, size: 3 + Math.random() * 3, rot: 0 }); }
    g.was = jump;
  }
}

function entities(dt, prevBottom) {
  const p = P, cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  const hb = { x: p.x + 4, y: p.y + 6, w: p.w - 8, h: p.h - 8 };
  for (const s of L.stars) if (!s.got && Math.abs(s.x - cx) < 34 && Math.abs(s.y - cy) < p.h / 2 + 18) { s.got = true; sfx.star(); addStars(1, s.x, s.y); }
  for (const h of L.hearts) if (!h.got && Math.abs(h.x - cx) < 36 && Math.abs(h.y - cy) < p.h / 2 + 20) { h.got = true; hearts = Math.min(MAX_HEARTS, hearts + 1); sfx.heart(); burst(h.x, h.y, 'heart', 10, '#ff6fa5'); updateHud(); }
  for (const w of L.walkers) {
    if (w.asleep) continue;
    w.x += w.dir * 34 * dt; if (w.x > w.max) { w.x = w.max; w.dir = -1; } if (w.x < w.min) { w.x = w.min; w.dir = 1; }
    const box = { x: w.x - 20, y: w.y - 32, w: 40, h: 32 };
    if (overlap(hb, box)) {
      if (p.vy > 0 && prevBottom <= box.y + 16) { w.asleep = true; p.vy = -520; p.sprung = true; p.sq = -0.15; sfx.stomp(); burst(w.x, w.y - 30, 'star', 6); }
      else hurt(w.x);
    }
  }
  for (const f of L.flyers) { const bob = Math.sin(time * 3 + f.ph) * 3; if (overlap(hb, { x: f.x - 18, y: f.gy - 124 + bob, w: 36, h: 42 })) hurt(f.x); }
  for (const h of L.hazards) if (overlap(hb, { x: h.x - 16, y: h.y - 30, w: 32, h: 30 })) hurt(h.x);
  for (const m of L.mushes) {
    m.sq = Math.max(0, m.sq - dt * 3); if (m.done) m.g = Math.min(1, m.g + dt * 0.9);
    const top = m.y - 80;
    if (m.done && m.g > 0.8 && p.vy > 0 && Math.abs(m.x - cx) < 38 && p.y + p.h > top - 4 && p.y + p.h < top + 24) { p.y = top - p.h; p.vy = -SPRING_V; p.sprung = true; p.sq = -0.3; m.sq = 1; sfx.spring(); burst(m.x, top, 'star', 5); }
  }
  for (const f of L.flags) if (!f.on && Math.abs(f.x - cx) < 34 && Math.abs(f.y - (p.y + p.h)) < 120) { f.on = true; p.cpX = f.x - p.w / 2; p.cpY = f.y; sfx.flag(); burst(f.x, f.y - 90, 'star', 10); }
  for (const f of L.friends) f.hop = Math.max(0, f.hop - dt);
  if (L.goal && Math.abs(L.goal.x - cx) < 26 && p.y + p.h > L.goal.y - 150 && p.hurtT <= 0 && !p.act) winLevel();
}

function winLevel() {
  setCrouch(false); P.act = null; P.vx = 0; P.face = 1; winT = 0; winShown = false; state = 'win';
  for (const k in keys) keys[k] = false;
  sfx.win(); confetti(); shutUp(); setTimeout(() => speak(['w_win'], true), 900);
  const r = ecoDone / Math.max(1, L.total), n = r >= 0.85 ? 3 : r >= 0.5 ? 2 : 1;
  save.best[L.idx] = Math.max(save.best[L.idx] || 0, n); save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, L.idx + 2)); persist();
  L.rating = n;
}

/* ---------------- Dibujo ---------------- */
function render() {
  const th = L.theme, eco = L.total ? ecoDone / L.total : 1;
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  const bg = BG[th.bg];
  if (ready(bg)) { // fondo pintado, en espejo para que no se note la unión
    const w = VIEW_H * bg.naturalWidth / bg.naturalHeight, off = -((cam.x * 0.3) % (2 * w));
    for (let i = 0, x = off; x < VIEW_W; i++, x += w) { if (x + w < 0) continue; ctx.save(); if (i % 2) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(bg, 0, 0, w, VIEW_H); } else ctx.drawImage(bg, x, 0, w, VIEW_H); ctx.restore(); }
  } else { ctx.fillStyle = '#9fdcff'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  // sol (sonríe cuando el mundo está cuidado) con rayitos que giran
  ctx.save(); ctx.translate(VIEW_W - 130, 100); ctx.rotate(time * 0.25); ctx.fillStyle = 'rgba(255,244,176,' + (0.25 + eco * 0.35).toFixed(2) + ')';
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(-9, -56); ctx.lineTo(0, -84 - Math.sin(time * 3 + i) * 6); ctx.lineTo(9, -56); ctx.fill(); }
  ctx.restore();
  circ(VIEW_W - 130, 100, 62); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); circ(VIEW_W - 130, 100, 44); ctx.fillStyle = '#fff4b0'; ctx.fill();
  ctx.fillStyle = '#e0a93a'; circ(VIEW_W - 144, 94, 3.5); ctx.fill(); circ(VIEW_W - 116, 94, 3.5); ctx.fill();
  ctx.strokeStyle = '#e0a93a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
  if (eco > 0.5) ctx.arc(VIEW_W - 130, 102, 12, 0.2, Math.PI - 0.2); else { ctx.moveTo(VIEW_W - 139, 112); ctx.lineTo(VIEW_W - 121, 112); }
  ctx.stroke(); ctx.lineCap = 'butt';
  // nubes
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 4; i++) {
    const span = VIEW_W + 300, x = ((i * 260 + 80 - cam.x * 0.15 - time * 6) % span + span) % span - 150, y = 50 + hash(i, 3) * 150, s = 0.7 + hash(i, 9) * 0.7;
    ell(x, y, 46 * s, 20 * s); ctx.fill(); ell(x - 26 * s, y + 6 * s, 30 * s, 16 * s); ctx.fill(); ell(x + 28 * s, y + 5 * s, 34 * s, 17 * s); ctx.fill(); ell(x + 4 * s, y - 14 * s, 26 * s, 18 * s); ctx.fill();
    if (i % 2 === 0) { // carita
      ctx.fillStyle = 'rgba(74,47,85,.55)'; const bl = (time + i * 1.7) % 4 < 0.13;
      if (bl) { ctx.fillRect(x - 12 * s, y - 2, 7 * s, 2); ctx.fillRect(x + 6 * s, y - 2, 7 * s, 2); } else { circ(x - 8 * s, y - 2, 2.6 * s); ctx.fill(); circ(x + 10 * s, y - 2, 2.6 * s); ctx.fill(); }
      ctx.strokeStyle = 'rgba(74,47,85,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + s, y + 4 * s, 5 * s, 0.25, Math.PI - 0.25); ctx.stroke();
      ctx.fillStyle = 'rgba(255,140,170,.35)'; circ(x - 16 * s, y + 5 * s, 4 * s); ctx.fill(); circ(x + 18 * s, y + 5 * s, 4 * s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
    }
  }
  drawSkyLife();


  // agua en los huecos
  ctx.fillStyle = th.water; ctx.beginPath(); ctx.moveTo(0, VIEW_H);
  for (let x = 0; x <= VIEW_W + 16; x += 16) ctx.lineTo(x, G + 46 + Math.sin((x + cam.x) * 0.04 + time * 2.5) * 5);
  ctx.lineTo(VIEW_W + 16, VIEW_H); ctx.fill();
  ctx.strokeStyle = th.waterLight; ctx.lineWidth = 4; ctx.beginPath();
  for (let x = 0; x <= VIEW_W + 16; x += 16) ctx.lineTo(x, G + 48 + Math.sin((x + cam.x) * 0.04 + time * 2.5) * 5);
  ctx.stroke();

  const camX = Math.round(cam.x * RS) / RS;
  ctx.save(); ctx.translate(-camX, 0);
  const vis = (x, m) => x > cam.x - (m || 140) && x < cam.x + VIEW_W + (m || 140);
  for (const d of L.decor) if (vis(d.x, 200) && BACK_DECOR[d.kind]) drawDecor(d);
  for (const s of L.seeds) if (vis(s.x, 200)) drawSeed(s);
  for (const g of L.amb.gaps) if (vis(g.x, 200)) drawFish(g);
  for (const s of L.solids) if (s.kind === 'ground' && s.x < cam.x + VIEW_W + 10 && s.x + s.w > cam.x - 10) drawGround(s);
  for (const b of L.amb.bugs) if (vis(b.x)) drawLadybug(b);
  for (const s of L.seeds) if (vis(s.x, 200)) drawSeedMound(s);
  for (const d of L.decor) if (vis(d.x) && !BACK_DECOR[d.kind]) drawDecor(d);
  ctx.restore();
  // El mundo se ve apagado hasta que lo cuidamos
  if (eco < 1) { ctx.fillStyle = 'rgba(112,108,96,' + (0.2 * (1 - eco)).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  ctx.save(); ctx.translate(-camX, 0);
  for (const s of L.signs) if (vis(s.x)) drawSign(s);
  if (L.goal && vis(L.goal.x, 220)) drawGoal(L.goal, false);
  for (const s of L.solids) if (s.kind === 'log' && vis(s.x + s.w / 2, 300)) drawLog(s);
  for (const pl of L.plats) if (vis(pl.x + pl.w / 2, 300)) drawPlat(pl);
  for (const m of L.movers) if (vis(m.x + m.w / 2, 300)) drawCloudPlat(m);
  for (const f of L.flags) if (vis(f.x)) drawFlag(f);
  for (const m of L.mushes) if (vis(m.x)) drawMush(m);
  for (const o of L.plants) if (vis(o.x)) drawPlant(o);
  for (const o of L.bins) if (vis(o.x)) drawBin(o);
  for (const o of L.trash) if (!o.got && vis(o.x)) drawTrash(o);
  for (const s of L.stars) if (!s.got && vis(s.x)) { const y = s.y + Math.sin(time * 3 + s.ph) * 4; starPath(s.x, y, 15, 7, Math.sin(time * 2 + s.ph) * 0.25); fs('#ffd84d', 2.5); starPath(s.x - 2, y - 2, 6, 3, 0); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill(); }
  for (const h of L.hearts) if (!h.got && vis(h.x)) { const s = 13 + Math.sin(time * 5) * 1.5; heartPath(h.x, h.y + Math.sin(time * 3) * 4, s); fs('#ff6fa5', 3); }
  for (const h of L.hazards) if (vis(h.x)) drawHazard(h);
  for (const q of L.quizzes) if (vis(q.owl.x, 600)) drawQuiz(q);
  for (const f of L.friends) if (!f.follow && vis(f.x)) drawFriend(f);
  for (let i = followers.length - 1; i >= 0; i--) drawFriend(followers[i]);
  for (const w of L.walkers) if (vis(w.x)) drawWalker(w);
  for (const f of L.flyers) if (vis(f.x)) drawFlyer(f);
  drawPlayer();
  if (L.goal && vis(L.goal.x, 220)) drawGoal(L.goal, true);
  drawButterflies(eco, vis);
  // Pista: qué puede hacer ahora con el botón ✋
  if (state === 'play' && !P.act) { const tg = findTarget(); if (tg) drawHint(tg.o.x, tg.o.y - (tg.type === 'pet' ? (FH[tg.o.kind] || 56) + 44 : tg.type === 'toss' ? 96 : tg.type === 'ask' ? 120 : 70), HINT[tg.type]); }
  for (const q of parts) {
    ctx.globalAlpha = clamp(q.life / 0.3, 0, 1);
    if (q.kind === 'star') { starPath(q.x, q.y, q.size, q.size / 2, q.rot); ctx.fillStyle = q.color; ctx.fill(); }
    else if (q.kind === 'heart') { heartPath(q.x, q.y, q.size); ctx.fillStyle = q.color; ctx.fill(); }
    else if (q.kind === 'conf') { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.color; ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2); ctx.restore(); }
    else { circ(q.x, q.y, q.size); ctx.fillStyle = q.color; ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  for (const c of cards) drawCard(c);
  ctx.restore();
  if (L.themeName === 'forest') drawLeaves();

  if (toast) {
    ctx.font = '700 30px Fredoka, "Comic Sans MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(toast.text).width + 44; ctx.globalAlpha = clamp(toast.t * 3, 0, 1);
    rr(VIEW_W / 2 - w / 2, 96, w, 52, 26); fs('#fff8ec', 3); ctx.fillStyle = INK; ctx.fillText(toast.text, VIEW_W / 2, 123); ctx.globalAlpha = 1;
  }
}

function hills(color, par, baseY, amp, freq) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, VIEW_H);
  for (let sx = 0; sx <= VIEW_W + 20; sx += 20) { const wx = sx + cam.x * par; ctx.lineTo(sx, baseY - amp * (Math.sin(wx * freq) + 0.5 * Math.sin(wx * freq * 2.3 + 1))); }
  ctx.lineTo(VIEW_W + 20, VIEW_H); ctx.fill();
}

function drawHint(x, y, icon) {
  const by = y + Math.sin(time * 5) * 4;
  rr(x - 24, by - 22, 48, 42, 16); fs('#fff', 3);
  ctx.beginPath(); ctx.moveTo(x - 6, by + 19); ctx.lineTo(x, by + 28); ctx.lineTo(x + 6, by + 19); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(icon, x, by);
}

function drawGround(s) {
  const th = L.theme, bottom = VIEW_H + 10;
  ctx.fillStyle = th.dirt; ctx.fillRect(s.x, s.y + 8, s.w, bottom - s.y);
  ctx.fillStyle = th.dirtDark;
  const i0 = Math.max(0, Math.floor((cam.x - s.x) / T)), i1 = Math.min(Math.ceil(s.w / T), Math.ceil((cam.x + VIEW_W - s.x) / T));
  for (let i = i0; i < i1; i++) for (let j = 0; j < 6; j++) {
    const k = hash(s.x / T + i, j * 7 + 1), px = s.x + i * T + 8 + k * 30, py = s.y + 44 + j * 34 + hash(i, j) * 14;
    if (py < bottom && px + 8 < s.x + s.w) { circ(px, py, 3 + k * 4); ctx.fill(); }
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x, s.y + 10); ctx.lineTo(s.x, bottom); ctx.moveTo(s.x + s.w, s.y + 10); ctx.lineTo(s.x + s.w, bottom); ctx.stroke();
  rr(s.x - 5, s.y, s.w + 10, 24, 12); fs(th.top, 3);
  ctx.strokeStyle = th.topLight; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s.x + 8, s.y + 7); ctx.lineTo(s.x + s.w - 8, s.y + 7); ctx.stroke(); ctx.lineCap = 'butt';
}

// Las plantitas se hacen a un lado cuando Mandy pasa (y se mecen con el viento)
function bend(x, y) {
  const dx = x - (P.x + P.w / 2); if (Math.abs(dx) > 46 || P.y + P.h < y - 40 || P.y + P.h > y + 6) return 0;
  return Math.sign(dx || 1) * (1 - Math.abs(dx) / 46);
}
// Tamaño (alto en px) de cada dibujo de decoración
const DECO_H = { tree: 150, pine: 165, palm: 150, snowpine: 145, barn: 110, bush: 52, rock: 44, stump: 42, haystack: 58, fence: 44, reeds: 66, shell: 20, starfish: 22, sandcastle: 46, snowrock: 46, mush: 26 };
function drawDecor(d) {
  const x = d.x, y = d.y + 1, r = d.r, k = d.kind;
  switch (k) {
    case 'fl': { const n = FLOWERS[Math.floor(r * 4)], h = 30 + r * 16, wind = Math.sin(time * 1.8 + x * 0.05) * 0.08;
      drawImg(n, x, y + 2, h, 1, 1 + Math.sin(time * 3 + x) * 0.02, wind + bend(x, y) * 0.55); break; }
    case 'flower': { const c = ['#ff7fb6', '#ffd84d', '#c69bff', '#ffffff', '#ff9a5c'][Math.floor(r * 5)], h = 16 + r * 12, sw = Math.sin(time * 2 + x) * 2 + bend(x, y) * 14;
      ctx.strokeStyle = '#3f9d55'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y - h); ctx.stroke();
      ctx.fillStyle = c; for (let i = 0; i < 5; i++) { circ(x + sw + Math.cos(i * 1.257) * 5, y - h + Math.sin(i * 1.257) * 5, 4); ctx.fill(); } circ(x + sw, y - h, 3); ctx.fillStyle = '#ffb02e'; ctx.fill(); break; }
    case 'tuft': { const q = Math.sin(time * 2.2 + x * 0.07) * 2 + bend(x, y) * 9; ctx.fillStyle = L.themeName === 'beach' ? '#8bd17c' : '#3f9d55'; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x - 6 + q, y - 12); ctx.lineTo(x - 2, y - 2); ctx.lineTo(x + q * 1.3, y - 16); ctx.lineTo(x + 3, y - 2); ctx.lineTo(x + 7 + q, y - 11); ctx.lineTo(x + 9, y); ctx.fill(); break; }
    default: {
      const h = (DECO_H[k] || 50) * (0.85 + r * 0.3), big = BACK_DECOR[k];
      const sway = big ? Math.sin(time * 1.2 + x * 0.01) * 0.025 : (k === 'reeds' ? Math.sin(time * 2 + x) * 0.08 + bend(x, y) * 0.4 : 0);
      const sq = k === 'mush' ? 1 - Math.abs(bend(x, y)) * 0.2 : 1;
      drawImg(k === 'mush' ? 'mush_small' : k, x, y + (big ? 6 : 3), h, r > 0.5 && k !== 'barn' ? -1 : 1, sq, sway);
    }
  }
}

/* --- Cosas para cuidar (dibujos del mismo estilo) --- */
const TRASH = ['t_bottle', 't_can', 't_paper', 't_bag', 't_banana', 't_juice'];
function drawTrash(t) {
  const n = TRASH[t.kind % 6], wob = Math.sin(time * 2.5 + t.x) * 0.06;
  ctx.fillStyle = 'rgba(74,47,85,.15)'; ell(t.x, t.y + 2, 16, 4); ctx.fill();
  drawImg(n, t.x, t.y + 3, n === 't_bottle' ? 24 : 32, 1, 1 + Math.sin(time * 3 + t.x) * 0.03, wob);
  // moscas chiquitas dando vueltas
  ctx.fillStyle = 'rgba(74,47,85,.55)';
  for (let i = 0; i < 2; i++) { const a = time * 3 + i * 3 + t.x; circ(t.x + Math.cos(a) * 14, t.y - 34 + Math.sin(a * 1.7) * 6, 1.8); ctx.fill(); }
}
function drawBin(b) {
  const q = b.sq; drawImg('bin', b.x, b.y + 4, 66, 1 + q * 0.12, 1 - q * 0.16);
  if (b.count > 0) { // cuántas basuras se han botado aquí
    b.pop = Math.max(0, (b.pop || 0) - 0.03); const s = 1 + b.pop * 0.5, cx = b.x + 26, cy = b.y - 70;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); circ(0, 0, 15); fs('#5fd08a', 3);
    ctx.fillStyle = '#fff'; ctx.font = '700 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.count, 0, 1); ctx.restore();
  }
}
function drawPlant(p) {
  const x = p.x, y = p.y, n = FLOWERS[p.c % 4];
  if (!p.done) { // flor seca y triste: necesita agua
    drawImg('wilted', x, y + 4, 52, 1, 0.97 + Math.sin(time * 1.4 + p.c) * 0.02, Math.sin(time * 1.1 + p.c) * 0.03);
    ctx.fillStyle = '#7fc4ea'; const ty = (time * 30 + p.c * 7) % 16; ctx.beginPath(); ctx.arc(x + 26, y - 26 + ty, 2.5, 0, 7); ctx.fill();
    return;
  }
  // ¡florece! crece con un saltito y se mece feliz
  const g = ease(p.g), pop = 1 + Math.sin(Math.min(1, p.g) * Math.PI) * 0.22, h = (40 + 30 * g) * pop;
  ctx.fillStyle = '#8a5a3c'; ell(x, y + 2, 20, 6); ctx.fill();
  drawImg(n, x, y + 3, h, 1 + Math.sin(time * 3 + x) * 0.03, 1, Math.sin(time * 2 + x) * 0.07);
}
function drawSeed(s) { // brotecito = "aquí se puede plantar"; al plantar crece un árbol
  const x = s.x, y = s.y;
  if (!s.done) { drawImg('sprout', x, y + 4, 40, 1, 1 + Math.sin(time * 2 + x) * 0.04, Math.sin(time * 1.6 + x) * 0.05); return; }
  const g = ease(s.g), pop = 1 + Math.sin(Math.min(1, s.g) * Math.PI) * 0.12;
  drawImg('tree', x, y + 6, (44 + 110 * g) * pop, 1, 1, Math.sin(time * 1.2 + x * 0.01) * 0.025);
}
function drawSeedMound() {}
function drawMush(m) { // hongo dormido -> al regarlo crece y se vuelve un hongo saltarín
  if (!m.done) { drawImg('mush_small', m.x, m.y + 4, 40, 1, 0.96 + Math.sin(time * 1.5 + m.x) * 0.03); ctx.fillStyle = INK; ctx.font = '700 13px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', m.x + 18, m.y - 44 + Math.sin(time * 2) * 3); return; }
  const g = ease(m.g), q = m.sq, h = (40 + 46 * g) * (1 - q * 0.25);
  drawImg('mush_big', m.x, m.y + 5, h, 1 + q * 0.2 + Math.sin(time * 3 + m.x) * 0.02, 1);
  if (g > 0.9) { ctx.fillStyle = INK; ctx.font = '700 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⇧', m.x, m.y - h - 14 - Math.abs(Math.sin(time * 4)) * 6); }
}

function drawSign(s) {
  const x = s.x, y = s.y;
  drawImg('sign', x, y + 4, 104);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '24px sans-serif'; ctx.fillStyle = INK; ctx.fillText(s.icon, x, y - 82);
  ctx.font = '700 14px Fredoka, "Comic Sans MS", sans-serif'; ctx.fillText(s.word, x, y - 61);
}
// Dibuja una imagen estirada a lo ancho sin deformar las puntas (3 partes)
function slice3(n, x, y, w, h, edge) {
  const im = IMG[n]; if (!ready(im)) return;
  const iw = im.naturalWidth, ih = im.naturalHeight, e = iw * (edge || 0.3), ew = e * h / ih;
  ctx.drawImage(im, 0, 0, e, ih, x, y, ew, h);
  ctx.drawImage(im, e, 0, iw - 2 * e, ih, x + ew - 0.5, y, Math.max(1, w - 2 * ew) + 1, h);
  ctx.drawImage(im, iw - e, 0, e, ih, x + w - ew, y, ew, h);
}
function drawLog(s) {
  drawImg('stump', s.x + 18, s.base + 4, 40, 1, (s.base - s.y - s.h + 8) / 34);
  drawImg('stump', s.x + s.w - 18, s.base + 4, 40, -1, (s.base - s.y - s.h + 8) / 34);
  slice3('log', s.x - 8, s.y - 10, s.w + 16, s.h + 22, 0.32);
}
function drawPlat(p) {
  if (L.themeName === 'lake' && p.y >= G - 40) { drawImg('lily', p.x + p.w / 2, p.y + 18, 30 + p.w * 0.05, (p.w + 30) / 64, 1); return; }
  slice3('platform', p.x - 8, p.y - 10, p.w + 16, 62, 0.3);
}
function drawCloudPlat(m) { drawImg('cloud', m.x + m.w / 2, m.y + 52, 72, (m.w + 26) / 88, 1); }
function drawFlag(f) {
  const im = f.on ? 'flag' : grey('flag') || 'flag';
  drawImg(im, f.x + 14, f.y + 4, 104, 1, 1, f.on ? Math.sin(time * 4) * 0.02 : 0);
  if (f.on) { starPath(f.x + 24, f.y - 112, 9, 4.5, time); ctx.fillStyle = '#ffd84d'; ctx.fill(); }
}
function drawSpring() {}
function drawHazard(h) {
  drawImg(L.theme.hazard, h.x, h.y + 4, 40, 1 + Math.sin(time * 4 + h.x) * 0.04, 1 - Math.sin(time * 4 + h.x) * 0.04);
}

function face(x, y, happy, gap) {
  gap = gap || 6; ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (happy) { ctx.beginPath(); ctx.arc(x - gap, y + 1, 3, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x + gap, y + 1, 3, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 5, 3.5, 0.15, Math.PI - 0.15); ctx.stroke(); }
  else { circ(x - gap, y, 2.6); ctx.fill(); circ(x + gap, y, 2.6); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + 9, 3.5, Math.PI + 0.3, -0.3); ctx.stroke(); }   // boquita triste
  ctx.lineCap = 'butt';
  ctx.fillStyle = 'rgba(255,120,160,.5)'; circ(x - gap - 5, y + 6, 3); ctx.fill(); circ(x + gap + 5, y + 6, 3); ctx.fill();
}

function rainCloud(x, y) {
  ctx.fillStyle = '#b9bcc9'; ell(x, y, 22, 10); ctx.fill(); ell(x - 13, y + 3, 12, 8); ctx.fill(); ell(x + 13, y + 3, 13, 8); ctx.fill(); ell(x + 2, y - 7, 12, 9); ctx.fill();
  ctx.fillStyle = '#7fb8e8';
  for (let i = 0; i < 3; i++) { const t = (time * 1.6 + i / 3) % 1; ctx.globalAlpha = 1 - t; ell(x - 12 + i * 12, y + 12 + t * 24, 2, 3.5); ctx.fill(); }
  ctx.globalAlpha = 1;
}
// Animalitos: tristes (grises y con nubecita) hasta que Mandy les hace cariño; después la siguen dando saltitos
function drawFriend(f) {
  const k = f.kind, h = FH[k] || 54, fol = f.follow, x = fol ? f.fx : f.x, base = fol ? f.fy : f.y;
  const hop = f.hop > 0 ? Math.abs(Math.sin(f.hop * 9)) * 16 : 0;
  let jump = fol ? Math.abs(Math.sin(f.walk)) * 9 * f.mv : 0;
  if (state === 'win' && f.greeted) jump = Math.abs(Math.sin(time * 7 + x)) * 18;
  const y = base - hop - jump;
  ctx.fillStyle = 'rgba(74,47,85,.15)'; ell(x, base + 2, h * 0.38, 5); ctx.fill();
  const dir = fol ? f.dirx : (P.x + P.w / 2 < x ? -1 : 1);
  if (!f.greeted) {
    const im = grey(k), br = Math.sin(time * 1.6 + x) * 0.015;
    if (im) drawImg(im, x, y, h, dir, 0.93 + br, 0.05 * dir);
    rainCloud(x, base - h - 30 + Math.sin(time * 2 + x) * 2);
  } else {
    const br = Math.sin(time * 3 + x) * 0.03, sq = fol ? 1 + Math.sin(f.walk * 2) * 0.06 * f.mv : 1;
    drawImg(k, x, y, h, dir * (1 - br * 0.5), (1 + br) * sq, Math.sin(time * 2 + x) * 0.05);
    if (!fol) { heartPath(x, base - h - 22 + Math.sin(time * 4) * 3, 8); fs('#ff6fa5', 2); }
  }
}

function drawWalker(w) {
  const x = w.x, y = w.y, k = L.theme.walker;
  if (k === 'snail') { const sq = w.asleep ? 0.72 : 1 + Math.sin(time * 6 + x) * 0.07; drawImg(w.asleep ? grey('snail') : 'snail', x, y + 2, 40, -w.dir * (w.asleep ? 1 : 2 - sq), sq); }
  else { const sq = w.asleep ? 0.72 : 1 + Math.abs(Math.sin(time * 9)) * 0.07; drawImg(w.asleep ? grey('crab') : 'crab', x, y + 2, 36, 1, sq, w.asleep ? 0 : Math.sin(time * 10) * 0.1); }
  if (w.asleep) { ctx.fillStyle = INK; ctx.font = '700 14px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', x + 14, y - 40 + Math.sin(time * 2) * 3); ctx.font = '700 10px Fredoka, sans-serif'; ctx.fillText('z', x + 22, y - 50 + Math.sin(time * 2 + 1) * 3); }
}

function drawFlyer(f) {
  const x = f.x, y = f.gy - 103 + Math.sin(time * 3 + f.ph) * 3, toLeft = P.x + P.w / 2 < x;
  if (L.theme.flyer === 'bee') drawImg('bee', x, y + 24, 48, toLeft ? 1 : -1, 1 + Math.sin(time * 40) * 0.04, Math.sin(time * 3 + f.ph) * 0.1);
  else drawImg('gull', x, y + 26, 52, toLeft ? -1 : 1, 1 + Math.sin(time * 9 + f.ph) * 0.12);
}

/* --- Vida del fondo --- */
function drawSkyLife() {
  if (L.themeName === 'beach') {
    for (let k = 0; k < 2; k++) { const x = ((time * 34 + k * 520) % (VIEW_W + 300)) - 150, y = 120 + k * 70 + Math.sin(time * 1.3 + k) * 12; drawImg('gull', x, y, 26 - k * 4, 1, 1 + Math.sin(time * 8 + k) * 0.15, 0, 0.8); }
    return;
  }
  ctx.strokeStyle = 'rgba(74,47,85,.45)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    const fx = ((time * 26 + k * 620) % (VIEW_W + 500)) - 250, fy = 90 + k * 70 + Math.sin(time * 0.7 + k) * 10;
    for (let i = 0; i < 4; i++) {
      const bx = fx - i * 20, by = fy + Math.abs(i - 1.5) * 9 - 13, wg = Math.sin(time * 9 + i * 1.3) * 4;
      ctx.beginPath(); ctx.moveTo(bx - 8, by - wg); ctx.quadraticCurveTo(bx - 3, by - 3 - wg * 0.5, bx, by); ctx.quadraticCurveTo(bx + 3, by - 3 - wg * 0.5, bx + 8, by - wg); ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
}
function drawFish(g) {
  const ph = (time + g.ph) % g.per; if (ph >= 1.1) return;
  const s = ph / 1.1, x = g.x + g.dir * (-34 + s * 68), y = G + 44 - Math.sin(s * Math.PI) * 120;
  const ang = Math.atan2(-Math.cos(s * Math.PI) * 120 * Math.PI, g.dir * 68), im = IMG.fish; if (!ready(im)) return;
  const sh = im.naturalHeight * 0.68, h = 30, w = h * im.naturalWidth / sh;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(-1, g.dir < 0 ? -1 : 1);
  ctx.drawImage(im, 0, 0, im.naturalWidth, sh, -w / 2, -h / 2, w, h); ctx.restore();
}
function drawLadybug(b) {
  const x = b.x + Math.sin(time * 0.35 + b.ph) * 36, dir = Math.cos(time * 0.35 + b.ph) > 0 ? 1 : -1;
  drawImg('ladybug', x, b.y + 1, 15, -dir, 1 + Math.sin(time * 12) * 0.04);
}
// Mariposas: aparecen más a medida que cuidas el lugar, y se alejan si Mandy se acerca
function drawButterflies(eco, vis) {
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2, n = (L.themeName === 'beach' ? 1 : 3) + eco * 7;
  for (const f of L.amb.flies) {
    if (f.i % 10 >= n || !vis(f.x, 240)) continue;
    let x = f.x + Math.sin(time * 0.6 + f.ph) * 90 + Math.sin(time * 1.7 + f.ph) * 20, y = f.y + Math.sin(time * 1.1 + f.ph * 2) * 35;
    const dx = x - pcx, dy = y - pcy, d = Math.hypot(dx, dy) || 1; if (d < 100) { x += dx / d * (100 - d); y += dy / d * (100 - d) - (100 - d) * 0.5; }
    drawImg(L.themeName === 'forest' && f.i % 3 === 2 ? 'bee' : 'butterfly', x, y + 13, 26, 0.2 + 0.8 * Math.abs(Math.sin(time * 11 + f.ph)), 1, Math.sin(time * 2 + f.ph) * 0.2);
  }
}
function drawLeaves() {
  const cols = ['#f2a23a', '#e8743b', '#8fcf5a', '#f6c84c'], W = VIEW_W + 100;
  for (let i = 0; i < 14; i++) {
    const sp = 0.5 + hash(i, 4), x = ((hash(i, 2) * W + Math.sin(time * 0.9 + i) * 40 - cam.x * 0.5) % W + W) % W - 50, y = ((time * 45 * sp + hash(i, 5) * VIEW_H) % (VIEW_H + 40)) - 20;
    ctx.save(); ctx.translate(x, y); ctx.rotate(time * 2 * sp + i); ctx.scale(1, Math.sin(time * 3 + i)); ell(0, 0, 7, 3.5); ctx.fillStyle = cols[i % 4]; ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < 9; i++) { // luciérnagas
    const x = ((hash(i, 7) * W - cam.x * 0.7 + Math.sin(time * 0.8 + i) * 30) % W + W) % W - 50, y = 300 + hash(i, 8) * 110 + Math.sin(time * 1.3 + i * 2) * 16, a = 0.35 + 0.35 * Math.sin(time * 3 + i);
    ctx.fillStyle = 'rgba(255,248,160,' + (a * 0.4).toFixed(2) + ')'; circ(x, y, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,250,190,' + a.toFixed(2) + ')'; circ(x, y, 2.6); ctx.fill();
  }
}

/* --- Retos del búho: puerta mágica, bloques con respuestas y pizarrita con la pregunta --- */
function drawQuiz(q) {
  const o = q.owl;
  rr(o.x - 24, o.y - 22, 48, 24, 8); fs('#a8703f', 3); ell(o.x, o.y - 22, 24, 6); fs('#e0b07a', 2.5);
  const hop = q.state === 'done' ? Math.abs(Math.sin(time * 6)) * 12 * Math.min(1, q.bump + 0.15) : 0, talk = vozCur && q.state === 'ask' ? Math.sin(time * 20) * 0.04 : 0;
  drawImg('owl', o.x, o.y - 22 - hop, 76, 1, 1 + talk, Math.sin(time * 1.5) * 0.06);
  for (const bl of q.blocks) {
    const bx = bl.x, by = bl.y - Math.sin(bl.bump * Math.PI) * 12, cx = bx + bl.w / 2;
    ctx.globalAlpha = bl.wrong ? 0.55 : 1;
    if (bl.reveal) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(time * 10) * 0.3; rr(bx - 7, by - 7, bl.w + 14, bl.h + 14, 16); fs('#7be07b', 0); ctx.restore(); }
    rr(bx, by, bl.w, bl.h, 12); fs(bl.right || bl.reveal ? '#7be07b' : bl.wrong ? '#d8d2dc' : '#ffd84d', 3);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(bx + 6, by + 5, bl.w - 12, 8, 4); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
    if (q.state === 'idle') { ctx.font = '700 30px Fredoka, sans-serif'; ctx.fillText('?', cx, by + bl.h / 2 + 2 + Math.sin(time * 4 + bl.i) * 2); }
    else if (q.Q.kind === 'eng') { const k = q.Q.opts[bl.i]; drawImg(bl.wrong ? grey(k) || k : k, cx, by + bl.h - 4, 44); }
    else if (q.Q.kind === 'col') { const c = COLS[q.Q.opts[bl.i]][2], my = by + bl.h / 2; circ(cx - 3, my + 1, 16); fs(c, 3); circ(cx + 12, my - 9, 7); fs(c, 2.5); circ(cx - 8, my - 4, 4); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); }
    else { ctx.font = '700 34px Fredoka, sans-serif'; ctx.fillText(q.Q.opts[bl.i], cx, by + bl.h / 2 + 2); }
    ctx.globalAlpha = 1;
  }
  if (q.Q) drawBoard(q);
  if (q.gate.open < 1) drawGate(q);
}
function drawBoard(q) {
  const Q = q.Q, cx = q.blocks[1].x + 27, top = 150, done = q.state === 'done';
  ctx.font = '700 30px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let text, w;
  const math = Q.kind === 'add' || Q.kind === 'sub';
  if (Q.kind === 'eng') { text = '🔊 Find the ' + WORDS[Q.ans][1].toLowerCase() + '!'; w = ctx.measureText(text).width + 50; }
  else if (Q.kind === 'col') { text = '🔊 Find ' + COLS[Q.ans][1].toLowerCase() + '!'; w = ctx.measureText(text).width + 50; }
  else if (Q.kind === 'num') { text = '🔊 Find ' + NUMS_EN[Q.ans].toLowerCase() + '!'; w = ctx.measureText(text).width + 50; }
  else { text = Q.a + (Q.kind === 'add' ? ' + ' : ' − ') + Q.b + ' = ' + (done ? Q.ans : '?'); w = Math.max(230, (Q.kind === 'add' ? Q.a + Q.b : Q.a) * 23 + 70); }
  const hgt = !math ? 56 : 104, x0 = cx - w / 2, wob = Math.sin(time * 2) * 2;
  ctx.save(); ctx.translate(0, wob);
  rr(x0, top, w, hgt, 18); fs(done ? '#d9f7e4' : '#fff8ec', 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 30, top + hgt); ctx.lineTo(cx, top + hgt + 14); ctx.lineTo(cx + 30, top + hgt); ctx.stroke(); // colita
  if (q.need > 1) for (let i = 0; i < q.need; i++) { starPath(cx - (q.need - 1) * 14 + i * 28, top - 18, 12, 6, 0); fs(i < q.got ? '#ffd84d' : '#fff8ec', 2.5); } // cuántas faltan para abrir
  if (math) { // manzanitas para contar
    const n = Q.kind === 'add' ? Q.a + Q.b : Q.a, gap = Q.kind === 'add' ? 18 : 0, rowW = n * 23 + gap; let ax = cx - rowW / 2 + 11;
    for (let i = 0; i < n; i++) {
      if (Q.kind === 'add' && i === Q.a) { ctx.fillStyle = '#e2579a'; ctx.font = '700 22px Fredoka, sans-serif'; ctx.fillText('+', ax + 1, top + 26); ax += gap; }
      const gone = Q.kind === 'sub' && i >= Q.a - Q.b;
      drawImg('apple', ax, top + 40 - (done ? Math.abs(Math.sin(time * 6 + i)) * 4 : 0), 26, 1, 1, 0, gone ? 0.35 : 1);
      if (gone) { ctx.strokeStyle = '#e2579a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax - 8, top + 18); ctx.lineTo(ax + 8, top + 36); ctx.moveTo(ax + 8, top + 18); ctx.lineTo(ax - 8, top + 36); ctx.stroke(); }
      ax += 23;
    }
    ctx.font = '700 32px Fredoka, sans-serif'; ctx.fillStyle = INK; ctx.fillText(text, cx, top + 74);
  } else { ctx.fillStyle = INK; ctx.fillText(text, cx, top + hgt / 2 + 2); }
  ctx.restore();
}
function drawGate(q) {
  const g = q.gate, top = Math.max(g.y, -10), bottom = g.y + g.h;
  ctx.save(); ctx.beginPath(); ctx.rect(g.x - 30, -20, g.w + 60, G + 14); ctx.clip();
  rr(g.x, top, g.w, bottom - top, 10); fs('#c98a52', 3);
  ctx.strokeStyle = 'rgba(74,47,85,.3)'; ctx.lineWidth = 2.5; for (let y = g.y + 30; y < bottom; y += 34) { if (y < -10) continue; ctx.beginPath(); ctx.moveTo(g.x + 6, y); ctx.lineTo(g.x + g.w - 6, y); ctx.stroke(); }
  ctx.strokeStyle = '#3f9d55'; ctx.lineWidth = 4; ctx.beginPath(); // enredadera
  for (let y = top; y < bottom; y += 6) ctx.lineTo(g.x + g.w / 2 + Math.sin(y * 0.06 + time) * (g.w / 2 - 4), y);
  ctx.stroke(); ctx.fillStyle = '#63c75f';
  for (let y = Math.max(top, g.y + 20); y < bottom; y += 38) { ell(g.x + g.w / 2 + Math.sin(y * 0.06 + time) * (g.w / 2 - 4) + 6, y, 7, 4); ctx.fill(); }
  // candado mágico
  const ly = bottom - 100 + Math.sin(time * 3) * 3, lx = g.x + g.w / 2, open = q.state === 'done';
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(lx, ly - 12 - (open ? 8 : 0), 10, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.5; ctx.stroke();
  rr(lx - 15, ly - 12, 30, 26, 6); fs('#ffd84d', 3);
  ctx.fillStyle = INK; ctx.font = '700 17px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(open ? '★' : '?', lx, ly + 2);
  for (let i = 0; i < 4; i++) { const a = time * 2 + i * 1.57; starPath(lx + Math.cos(a) * 30, ly + Math.sin(a) * 30, 5, 2.5, a); ctx.fillStyle = 'rgba(255,216,77,.85)'; ctx.fill(); }
  ctx.restore();
}

/* --- Tarjetita: "Conejito = Bunny" --- */
function drawCard(c) {
  const age = 3.2 - c.t, a = clamp(Math.min(c.t * 2, age * 6), 0, 1), pop = 1 + Math.max(0, 0.25 - age) * 1.4;
  ctx.font = '700 25px Fredoka, sans-serif'; const w1 = ctx.measureText(c.en).width; ctx.font = '500 18px Fredoka, sans-serif'; const w2 = ctx.measureText(c.es).width;
  const w = Math.max(w1 + 30, w2) + 90, h = 76, x = clamp(c.x, cam.x + w / 2 + 10, cam.x + VIEW_W - w / 2 - 10), y = Math.max(70, c.y - age * 8);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(pop, pop);
  rr(-w / 2, -h / 2, w, h, 20); fs('#fff', 3);
  if (IMG[c.pic]) drawImg(c.pic, -w / 2 + 40, h / 2 - 8, 58); else { ctx.font = '34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.pic, -w / 2 + 40, 2); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.font = '500 18px Fredoka, sans-serif'; ctx.fillText(c.es, -w / 2 + 78, -15);
  rr(-w / 2 + 76, 2, 26, 18, 6); ctx.fillStyle = '#7fb8ff'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 11px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EN', -w / 2 + 89, 12);
  ctx.textAlign = 'left'; ctx.fillStyle = '#e2579a'; ctx.font = '700 25px Fredoka, sans-serif'; ctx.fillText(c.en, -w / 2 + 108, 13);
  ctx.restore();
}

function drawGoal(g, front) {
  if (front) return;
  drawImg('rainbow', g.x, g.y + 10, 200, 1, 1 + Math.sin(time * 2) * 0.015);
  starPath(g.x, g.y - 168 + Math.sin(time * 3) * 5, 22, 10, Math.sin(time * 2) * 0.3); fs('#ffd84d', 3);
}

function drawPlayer() {
  const p = P; let name = 'idle', bob = 0, sc = 1, lean = 0;
  const moving = p.grounded && Math.abs(p.vx) > 30;
  if (state === 'win') name = 'celebrate';
  else if (p.hurtT > 0) name = 'fall';
  else if (p.act) { name = ACT[p.act.type].spr; if (p.act.type === 'pet') bob = Math.sin(p.act.t * 14) * 1.5; if (p.act.type === 'thumbs') bob = -Math.abs(Math.sin(p.act.t * 9)) * 6; }
  else if (p.crouch) { name = 'crouch'; sc = 0.8; if (Math.abs(p.vx) > 20) bob = Math.sin(time * 18) * 2; }
  else if (!p.grounded) { name = 'jump'; lean = clamp(p.vy / 2600, -0.12, 0.2); }
  else if (moving) { const f = Math.floor(p.dist / 24); name = WALK[f % 6]; lean = 0.045 * clamp(Math.abs(p.vx) / SPEED, 0, 1); bob = -Math.abs(Math.sin(p.dist / 24 * Math.PI)) * 2.5; }
  const fx = p.x + p.w / 2, fy = p.y + p.h;
  if (p.grounded) { ctx.fillStyle = 'rgba(74,47,85,.18)'; ell(fx, fy + 2, 24, 6); ctx.fill(); }
  const im = SPR[name], isNew = NEW.indexOf(name) >= 0;
  const breathe = name === 'idle' ? Math.sin(time * 2.6) * 0.012 : 0;
  let fv = p.faceVis; if (Math.abs(fv) < 0.2) fv = fv < 0 ? -0.2 : 0.2;
  ctx.save(); ctx.translate(fx, fy + 4 + bob); ctx.scale(fv * (1 + p.sq * 0.6), 1 - p.sq + breathe); ctx.rotate(lean);
  if (p.inv > 0 && state === 'play' && Math.floor(time * 12) % 2) ctx.globalAlpha = 0.45;
  if (im.complete && im.naturalWidth) {
    const k = DRAW_H / (isNew ? H_NEW : H_OLD) * sc, w = im.naturalWidth * k, h = im.naturalHeight * k;
    if (p.bag > 0 && name !== 'toss') { // bolsa de basura al hombro, se mece al caminar y crece con lo que lleva
      const sw = moving ? Math.sin(p.dist / 24 * Math.PI) * 0.12 : Math.sin(time * 2) * 0.04, sz = 42 + Math.min(p.bag, 4) * 4;
      drawImg('sack', -22, (name === 'crouch' ? -26 : -46) + (moving ? Math.abs(Math.sin(p.dist / 24 * Math.PI)) * 3 : 0), sz, 1, 1, -0.35 + sw);
    }
    ctx.drawImage(im, -w * (AX[name] || 0.5), -h, w, h);
    // de pie o saltando con basura: la bolsita en la mano
  } else { rr(-15, -p.h, 30, p.h, 12); fs('#ff7fb6', 3); }
  ctx.restore();
  if (idleT > 6 && state === 'play') { // flechita que invita a seguir
    ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = clamp((idleT - 6) * 2, 0, 1);
    ctx.fillText('➡️', fx + 56 + Math.abs(Math.sin(time * 4)) * 12, p.y + 20); ctx.globalAlpha = 1;
  }
  if (p.bag > 0 && state === 'play') { // cuántas basuras lleva
    circ(fx + 26, p.y - 14, 13); fs('#3fae6a', 2.5); ctx.fillStyle = '#fff'; ctx.font = '700 15px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.bag, fx + 26, p.y - 13);
  }
}

/* ---------------- Pantallas ---------------- */
const $ = id => document.getElementById(id);
function setState(s) {
  state = s;
  $('scrTitle').classList.toggle('on', s === 'title'); $('scrSelect').classList.toggle('on', s === 'select');
  $('scrPause').classList.toggle('on', s === 'pause'); $('scrPad').classList.toggle('on', s === 'pad'); $('scrMini').classList.toggle('on', s === 'mini'); $('scrVet').classList.toggle('on', s === 'vet'); $('scrFin').classList.toggle('on', s === 'fin'); $('scrIntro').classList.toggle('on', s === 'intro'); $('scrWin').classList.remove('on');
  const inGame = s === 'play' || s === 'pause' || s === 'win' || s === 'intro';
  $('hud').classList.toggle('on', inGame); $('touch').classList.toggle('on', isTouch && s === 'play');
  musWant = inGame ? 'game' : 'menu'; syncMusic(); rotTipCheck();
}
function pause() { if (state === 'play') { setState('pause'); for (const k in keys) keys[k] = false; } }
function resume() { setState('play'); last = performance.now(); }
function showIntro() {
  $('introTitle').textContent = '¡' + L.name + ' necesita tu ayuda!';
  const rows = [['🗑️', L.trash.length, 'Recoge la basura y llévala al basurero'], ['💧', L.plants.length, 'Riega las plantitas tristes'], ['🌱', L.seeds.length, 'Planta arbolitos'], ['💗', L.friends.length, 'Hazle cariño a los animalitos'], ['🦉', L.quizzes.length, 'Resuelve los retos del búho']];
  $('introList').innerHTML = rows.filter(r => r[1]).map(r => '<div class="mrow"><span class="mi">' + r[0] + '</span><span class="mt">' + r[2] + '</span><span class="mn">×' + r[1] + '</span></div>').join('');
  setState('intro'); speak(['intro' + L.idx], true); talkCD = 4;
}
function beginPlay() { setState('play'); last = performance.now(); }
function showSelect() {
  shutUp();
  const box = $('levels'); box.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const open = i < save.unlocked, b = document.createElement('button'); b.className = 'lvl' + (open ? '' : ' locked');
    const n = save.best[i] || 0;
    b.innerHTML = '<div class="ico">' + (open ? lv.icon : '🔒') + '</div><div class="nm">' + (i + 1) + '. ' + lv.name + '</div><div class="st">' + '⭐'.repeat(n) + '<span style="opacity:.25">' + '⭐'.repeat(3 - n) + '</span></div>';
    if (open) b.onclick = () => { initAudio(); play('click', 0.5); startLevel(i); };
    box.appendChild(b);
  });
  setState('select');
}
function showWin() {
  winShown = true; const n = L.rating, lastLvl = L.idx === LEVELS.length - 1, all = ecoDone >= L.total;
  $('winTitle').textContent = all ? L.theme.happy : '¡Lo lograste!';
  $('winStars').innerHTML = [0, 1, 2].map(i => '<span class="' + (i < n ? '' : 'off') + '">⭐</span>').join('');
  $('winCount').innerHTML = '🌍 ' + ecoDone + ' / ' + L.total + ' &nbsp; ⭐ ' + starsGot + ' &nbsp; 🗑️ ' + (L.tossed || 0) + (followers.length ? ' &nbsp; 🐾 ' + followers.length : '');
  $('winTip').textContent = all ? (lastLvl ? '¡Cuidaste todo el planeta! 🎉' : '¡Gracias por cuidar el planeta!') : '¿Volvemos a ayudar a los que faltaron?';
  const mini = L.idx % 2 === 1; // después del 2º, 4º y 6º mundo viene un minijuego
  $('btnNext').textContent = mini ? (L.idx === 3 ? '🏥 ¡Veterinaria! ▶' : '🎲 ¡Minijuego! ▶') : 'Siguiente ▶';
  $('btnNext').style.display = lastLvl && !mini ? 'none' : '';
  $('scrWin').classList.add('on');
}
$('gameTitle').textContent = 'La Aventura de ' + HERO_NAME; document.title = 'La Aventura de ' + HERO_NAME;
if (isTouch) $('keysHelp').style.display = 'none';
$('btnPlay').onclick = () => { initAudio(); showSelect(); };
$('btnBack').onclick = () => setState('title');
$('btnGo').onclick = () => { initAudio(); beginPlay(); };
$('btnPause').onclick = () => { if (state === 'play') pause(); };
$('btnResume').onclick = resume;
$('btnRestart').onclick = $('btnAgain').onclick = () => startLevel(L.idx);
$('btnMenu').onclick = $('btnMenu2').onclick = showSelect;
$('btnNext').onclick = () => {
  const nxt = L.idx + 1, go = () => nxt < LEVELS.length ? startLevel(nxt) : showFinale();
  // después del 2º y 6º mundo: unir parejas; después del 4º: la veterinaria
  if (L.idx === 3) startVet(go); else if (L.idx % 2 === 1) startMini(Math.floor(L.idx / 2), go); else go();
};

/* ---------- Minijuego: unir parejas (vocales, colores y animales) ----------
   Se toca algo de la izquierda y luego su pareja de la derecha: se dibuja una línea y la voz dice la palabra
   en español y en inglés. 3 rondas; después sigue el siguiente mundo. */
const VOWELS = {
  A: [['abeja', 'Abeja', 'Bee', 'bee'], ['ardilla', 'Ardilla', 'Squirrel', 'squirrel'], ['arbol', 'Árbol', 'Tree', 'tree'], ['arcoiris', 'Arcoíris', 'Rainbow', 'rainbow'], ['avion', 'Avión', 'Airplane', 'v_avion'], ['anillo', 'Anillo', 'Ring', 'v_anillo']],
  E: [['erizo', 'Erizo', 'Hedgehog', 'hedgehog'], ['estrella', 'Estrella', 'Star', 'v_estrella'], ['elefante', 'Elefante', 'Elephant', 'elephant']],
  I: [['iguana', 'Iguana', 'Iguana', 'v_iguana'], ['iglu', 'Iglú', 'Igloo', 'v_iglu'], ['isla', 'Isla', 'Island', 'v_isla']],
  O: [['oveja', 'Oveja', 'Sheep', 'lamb'], ['oso', 'Oso', 'Bear', 'bear'], ['ola', 'Ola', 'Wave', 'v_ola'], ['ojo', 'Ojo', 'Eye', 'v_ojo'], ['oruga', 'Oruga', 'Caterpillar', 'v_oruga']],
  U: [['uvas', 'Uvas', 'Grapes', 'v_uvas'], ['unicornio', 'Unicornio', 'Unicorn', 'v_unicornio']],
};
// cosas de cada color (dibujo, nombre en español)
const COLOR_THINGS = { red: [['apple', 'Manzana'], ['parrot', 'Loro']], yellow: [['chick', 'Pollito'], ['v_estrella', 'Estrella']], green: [['frog', 'Rana'], ['v_iguana', 'Iguana']], pink: [['pig', 'Chanchito'], ['flamingo', 'Flamenco']],
  orange: [['fox', 'Zorrito']], brown: [['beaver', 'Castor'], ['bear', 'Osito']], purple: [['octopus', 'Pulpo'], ['v_uvas', 'Uvas']], blue: [['dolphin', 'Delfín']] };
// frutas: dibujo → [español, inglés, color]
const FRUTAS = { f_platano: ['Plátano', 'Banana', 'yellow'], f_naranja: ['Naranja', 'Orange', 'orange'], f_frutilla: ['Frutilla', 'Strawberry', 'red'], f_sandia: ['Sandía', 'Watermelon', 'red'],
  f_pina: ['Piña', 'Pineapple', 'yellow'], f_pera: ['Pera', 'Pear', 'green'], f_cereza: ['Cereza', 'Cherry', 'red'], f_limon: ['Limón', 'Lemon', 'yellow'], f_durazno: ['Durazno', 'Peach', 'pink'],
  f_kiwi: ['Kiwi', 'Kiwi', 'green'], f_mango: ['Mango', 'Mango', 'orange'], f_coco: ['Coco', 'Coconut', 'brown'], apple: ['Manzana', 'Apple', 'red'], v_uvas: ['Uvas', 'Grapes', 'purple'] };
for (const k in FRUTAS) if (!WORDS[k] || k.startsWith('f_')) WORDS[k] = [FRUTAS[k][0], FRUTAS[k][1]];
const frBase = k => k === 'apple' ? 'manzana' : k.replace(/^[fv]_/, '');
const frVoz = k => k === 'v_uvas' ? 'vw_uvas' : 'fr_' + frBase(k); // "¡Plátano! En inglés: Banana"
let mini = null;
function picHTML(p, cls) { return IMG[p] || /^[a-z_]+$/.test(p) ? '<img class="' + (cls || '') + '" src="' + (IMG[p] ? IMG[p].src : '') + '" alt="">' : p; }
function startMini(n, done) {
  // 2 rondas: siempre una de frutas, más otra (vocales la primera vez; después al azar)
  const other = n === 0 ? 'vow' : pick(['vow', 'col', 'ani']);
  mini = { round: 0, rounds: shuffle([other, 'fru']), done, n };
  setState('mini'); $('scrWin').classList.remove('on'); speak(['mg_intro'], true); miniRound();
}
function miniRound() {
  const m = mini, kind = m.rounds[m.round]; m.sel = null; m.pairs = []; m.left = []; m.right = [];
  $('miniDots').innerHTML = m.rounds.map((_, i) => '<span>' + (i < m.round ? '⭐' : i === m.round ? '🌟' : '⚪') + '</span>').join('');
  $('miniWord').innerHTML = '&nbsp;';
  if (kind === 'vow') {
    $('miniTitle').textContent = '🔤 ¿Con qué letra empieza?';
    const vs = shuffle(Object.keys(VOWELS)).slice(0, 4);
    for (const v of vs) { const it = pick(VOWELS[v]); m.pairs.push({ l: '<span>' + v + '<small style="font-size:.6em">' + v.toLowerCase() + '</small></span>', r: picHTML(it[3]), es: it[1], en: it[2], voz: ['vw_' + it[0]], lv: ['vl_' + v.toLowerCase()] }); }
  } else if (kind === 'col') {
    $('miniTitle').textContent = '🎨 Une cada color';
    for (const c of shuffle(Object.keys(COLOR_THINGS)).slice(0, 4)) { const [img, es] = pick(COLOR_THINGS[c]); m.pairs.push({ l: '<span class="blob" style="background:' + COLS[c][2] + '"></span>', r: picHTML(img), es: COLS[c][0] + ' · ' + es, en: COLS[c][1], voz: ['col_' + c] }); }
  } else if (kind === 'fru') {
    $('miniTitle').textContent = '🍓 ¿De qué color es la fruta?';
    const cs = new Set();
    for (const k of shuffle(Object.keys(FRUTAS))) {
      const [es, en, c] = FRUTAS[k]; if (cs.has(c)) continue; cs.add(c);
      m.pairs.push({ l: picHTML(k), r: '<span class="blob" style="background:' + COLS[c][2] + '"></span>', es: es + ' · ' + COLS[c][0], en: en + ' · ' + COLS[c][1], voz: [frVoz(k), 'col_' + c], fruit: k });
      if (m.pairs.length === 4) break;
    }
  } else {
    $('miniTitle').textContent = '🐾 Encuentra su sombra';
    const met = (save.met || []).filter(k => FH[k]), pool = met.length >= 4 ? met : Object.keys(FH);
    for (const a of shuffle(pool.slice()).slice(0, 4)) m.pairs.push({ l: picHTML(a), r: picHTML(a, 'shadow'), es: WORDS[a][0], en: WORDS[a][1], voz: ['eningles', 'en_' + a] });
  }
  const order = shuffle(m.pairs.map((_, i) => i));
  $('miniL').innerHTML = m.pairs.map((p, i) => '<button class="mi-b" data-i="' + i + '">' + p.l + '</button>').join('');
  $('miniR').innerHTML = order.map(i => '<button class="mi-b" data-i="' + i + '">' + m.pairs[i].r + '</button>').join('');
  $('miniLines').innerHTML = '';
  $('miniL').querySelectorAll('.mi-b').forEach(b => b.onclick = () => miniPick('l', b));
  $('miniR').querySelectorAll('.mi-b').forEach(b => b.onclick = () => miniPick('r', b));
}
function miniPick(side, b) {
  const m = mini; if (b.classList.contains('ok')) return;
  initAudio();
  if (!m.sel || m.sel.side === side) { // primera elección (o cambia de idea)
    document.querySelectorAll('#scrMini .mi-b.sel').forEach(x => x.classList.remove('sel'));
    m.sel = { side, b }; b.classList.add('sel'); play('click', 0.4);
    const p = m.pairs[+b.dataset.i]; if (side === 'l' && p.lv) speak(p.lv, true);
    return;
  }
  const a = m.sel.b; m.sel = null; a.classList.remove('sel');
  if (a.dataset.i === b.dataset.i) {
    const p = m.pairs[+b.dataset.i]; a.classList.add('ok'); b.classList.add('ok'); play('star', 0.5);
    const L1 = side === 'l' ? b : a, R1 = side === 'l' ? a : b, box = $('miniBoard').getBoundingClientRect(), r1 = L1.getBoundingClientRect(), r2 = R1.getBoundingClientRect();
    $('miniLines').insertAdjacentHTML('beforeend', '<line x1="' + (r1.right - box.left) + '" y1="' + (r1.top + r1.height / 2 - box.top) + '" x2="' + (r2.left - box.left) + '" y2="' + (r2.top + r2.height / 2 - box.top) + '" stroke="#ff7fb6" stroke-width="7" stroke-linecap="round"/>');
    $('miniWord').innerHTML = p.es + ' · <span class="en">' + p.en + '</span>';
    speak(p.voz, true);
    if (p.fruit) { save.fruits = save.fruits || []; if (save.fruits.indexOf(p.fruit) < 0) { save.fruits.push(p.fruit); persist(); } }
    if ($('miniL').querySelectorAll('.mi-b:not(.ok)').length === 0) {
      m.round++; burst(P ? P.x : 0, 0, 'star', 1);
      setTimeout(() => {
        if (m.round < m.rounds.length) miniRound();
        else { $('miniDots').innerHTML = '⭐'.repeat(m.rounds.length); $('miniTitle').textContent = '🎉 ¡Muy bien, Amanda!'; speak(['p2'], true); confetti && 0; setTimeout(() => { const d = m.done; mini = null; d(); }, 2600); }
      }, 2400);
    }
  } else { a.classList.add('bad'); b.classList.add('bad'); sfx.hurt(); setTimeout(() => { a.classList.remove('bad'); b.classList.remove('bad'); }, 400); speak(['e_casi'], true); }
}

/* ---------- Minijuego: la veterinaria ----------
   Llega un perrito (y después un gatito) sucio y herido. Amanda busca en la bandeja la herramienta correcta:
   jabón (queda lleno de espuma) → ducha (queda limpio pero con la herida) → inyección (queda sanito y feliz).
   Cada paso cambia el dibujo de la mascota (4 dibujos por mascota: vet_<animal>_1..4). */
const VET_TOOLS = { soap: ['🧼', 'Jabón'], shower: ['🚿', 'Ducha'], shot: ['💉', 'Inyección'], thermo: ['🌡️', 'Termómetro'],
  pill: ['💊', 'Pastilla'], bear: ['🧸', 'Peluche'], bone: ['🦴', 'Hueso'], yarn: ['🧶', 'Lana'] };
const VET_PETS = [{ pet: 'dog', name: 'perrito', hi: 'vet_perro' }, { pet: 'cat', name: 'gatito', hi: 'vet_gato' }];
const VET_STEPS = [
  { tool: 'soap', txt: '🛁 ¡Está muy sucio! Busca el <b>jabón</b> para bañarlo', voz: 'vet_sucio', fx: 'foam' },
  { tool: 'shower', txt: '🫧 ¡Qué espuma! Ahora enjuágalo con la <b>ducha</b>', voz: 'vet_ducha', fx: 'rain' },
  { tool: 'shot', txt: '🤕 Está limpio, pero tiene una herida… ¡busca la <b>inyección</b>!', voz: 'vet_inyeccion', fx: 'heal' },
];
let vet = null;
function vetPic(P, n) { const k = 'vet_' + P.pet + '_' + n; return IMG[k] && IMG[k].naturalWidth ? IMG[k].src : IMG[P.pet].src; }
function startVet(done) {
  vet = { p: 0, done };
  setState('vet'); $('scrWin').classList.remove('on'); vetPatient();
}
function vetPatient() {
  const P = VET_PETS[vet.p]; vet.s = 0; vet.busy = false;
  $('vetPet').innerHTML = '<img id="vetImg" src="' + vetPic(P, 1) + '" alt=""><div id="vetFx"></div>';
  $('vetPet').className = 'vet-pet st1' + (IMG['vet_' + P.pet + '_1'] && IMG['vet_' + P.pet + '_1'].naturalWidth ? ' drawn' : '');
  const need = VET_STEPS.map(s => s.tool), extra = shuffle(Object.keys(VET_TOOLS).filter(k => need.indexOf(k) < 0)).slice(0, 3);
  $('vetTools').innerHTML = shuffle(need.concat(extra)).map(k => '<button class="vt" data-t="' + k + '"><span>' + VET_TOOLS[k][0] + '</span><small>' + VET_TOOLS[k][1] + '</small></button>').join('');
  $('vetTools').querySelectorAll('.vt').forEach(b => b.onclick = () => vetTool(b));
  $('vetTitle').textContent = '🏥 ¡Veterinaria! ' + (P.pet === 'dog' ? '🐶' : '🐱');
  speak([P.hi], true); vetShowStep();
}
function vetShowStep() {
  const st = VET_STEPS[vet.s];
  $('vetHelp').innerHTML = st.txt;
  $('vetDots').innerHTML = VET_PETS.map((P, i) => '<span class="' + (i <= vet.p ? 'ok' : '') + '">' + (i < vet.p ? '💖' : P.pet === 'dog' ? '🐶' : '🐱') + '</span>').join('') +
    ' &nbsp; ' + VET_STEPS.map((s, i) => '<span class="' + (i < vet.s ? 'ok' : i === vet.s ? 'now' : '') + '">' + VET_TOOLS[s.tool][0] + '</span>').join('');
  speak([st.voz]);
}
function vetFx(ch, x, y, cls, delay) { setTimeout(() => { const s = document.createElement('span'); s.className = 'vfx ' + (cls || ''); s.textContent = ch; s.style.left = x + '%'; s.style.top = y + '%'; $('vetFx').appendChild(s); setTimeout(() => s.remove(), 1500); }, delay || 0); }
function vetTool(b) {
  if (vet.busy) return; initAudio();
  const st = VET_STEPS[vet.s], P = VET_PETS[vet.p];
  if (b.dataset.t !== st.tool) { b.classList.add('bad'); sfx.hurt(); setTimeout(() => b.classList.remove('bad'), 400); speak(['vet_esa_no'], true); $('vetHelp').innerHTML = '🙈 Esa no es… ' + st.txt; return; }
  vet.busy = true; b.classList.add('sel'); play('click', 0.5);
  const box = $('vetPet'), img = $('vetImg');
  // efecto de la acción y, a mitad del efecto, cambia el dibujo de la mascota al siguiente estado
  if (st.fx === 'foam') { for (let i = 0; i < 14; i++) vetFx('🫧', 15 + ri(70), 25 + ri(60), 'bub', i * 60); play('splash', 0.3); }
  if (st.fx === 'rain') { vetFx('🚿', 50, 2, 'head'); for (let i = 0; i < 16; i++) vetFx('💧', 20 + ri(60), 8, 'drop', i * 70); play('water', 0.5); }
  if (st.fx === 'heal') { vetFx('💉', 64, 52, 'poke'); for (let i = 0; i < 6; i++) vetFx('✨', 25 + ri(50), 30 + ri(50), 'up', 500 + i * 90); }
  setTimeout(() => { box.classList.add('swap'); }, 550);
  setTimeout(() => { img.src = vetPic(P, vet.s + 2); box.classList.remove('st1', 'st2', 'st3', 'swap'); box.classList.add('st' + (vet.s + 2)); }, 800);
  setTimeout(() => {
    b.classList.remove('sel'); b.classList.add('used'); vet.s++;
    if (vet.s < VET_STEPS.length) { play('star', 0.4); vet.busy = false; vetShowStep(); return; }
    play('win', 0.5); for (let i = 0; i < 8; i++) vetFx(pick(['💖', '⭐', '💕']), 15 + ri(70), 30 + ri(40), 'up', i * 120);
    $('vetHelp').innerHTML = '🎉 ¡El ' + P.name + ' quedó sanito y feliz!'; speak(['vet_sano'], true);
    vet.p++;
    setTimeout(() => {
      if (vet.p < VET_PETS.length) vetPatient();
      else { $('vetDots').innerHTML = '💖💖'; $('vetHelp').innerHTML = '🩺 ¡Eres una gran doctora, Amanda!'; speak(['p2'], true); setTimeout(() => { const d = vet.done; vet = null; d(); }, 2600); }
    }, 3400);
  }, 1500);
}

/* ---------- Final del juego: el planeta feliz ----------
   Al terminar el último mundo (y su minijuego): la Tierra aparece girando y sonriendo, los animalitos que conoció
   dan vueltas a su alrededor, Amanda la abraza y cae confeti. */
function showFinale() {
  save.finished = true; persist();
  const met = (save.met || []).filter(k => IMG[k]), friends = shuffle(met.length >= 6 ? met.slice() : Object.keys(FH).filter(k => IMG[k])).slice(0, 8);
  $('finOrbit').innerHTML = friends.map((k, i) => {
    const a = i / friends.length * Math.PI * 2 - Math.PI / 2, r = 292; // % del ancho de cada dibujo
    return '<img src="' + IMG[k].src + '" alt="" style="transform:translate(' + (Math.cos(a) * r).toFixed(0) + '%,' + (Math.sin(a) * r).toFixed(0) + '%)">';
  }).join('');
  const stars = save.best.reduce((s, n) => s + (n || 0), 0);
  $('finStats').innerHTML = '<span class="pill">🌍 ' + LEVELS.length + ' mundos</span><span class="pill">⭐ ' + stars + ' / ' + LEVELS.length * 3 + '</span>' + (met.length ? '<span class="pill">🐾 ' + met.length + ' amigos</span>' : '') +
    ((save.fruits || []).length ? '<span class="pill">🍓 ' + save.fruits.length + ' frutas</span>' : '');
  setState('fin'); $('scrWin').classList.remove('on');
  shutUp(); play('win', 0.6); setTimeout(() => speak(['w_win', 'p_todo'], true), 1200);
  const box = $('finConf'), cols = ['#ff7fb6', '#ffd84d', '#7be0c3', '#7fb8ff', '#c69bff'];
  box.innerHTML = '';
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('span'); c.className = 'fin-conf';
    c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % 5];
    c.style.animationDuration = (3 + Math.random() * 3) + 's'; c.style.animationDelay = (Math.random() * 4) + 's';
    box.appendChild(c);
  }
}
$('btnFinPlay').onclick = () => { initAudio(); play('click', 0.5); startLevel(0); };
$('btnFinHome').onclick = () => { play('click', 0.5); setState('title'); };

/* ---------- Pantalla para elegir los botones del control ---------- */
const PAD_ACTS = [['jump', '⬆ Saltar'], ['wave', '✋ Ayudar'], ['greet', '👋 Saludar'], ['start', '⏸ Pausa']];
function padSym(i) { const s = padStd ? { 0: '✕', 1: '○', 2: '□', 3: '△', 9: 'Start', 8: 'Select' } : { 0: '△', 1: '○', 2: '✕', 3: '□', 9: 'Start', 8: 'Select' }; return (s[i] ? s[i] + ' ' : '') + '(' + i + ')'; }
function padMap() { return save.pad || (padStd ? PADMAP.std : PADMAP.ps1); }
function paintPadRows() {
  const m = padMap();
  $('padRows').innerHTML = PAD_ACTS.map(([k, n]) => '<span>' + n + '</span><span class="pv' + (padCapture === k ? ' wait' : '') + '">' + (padCapture === k ? 'presiona…' : (m[k] || []).map(padSym).join(' · ') || '—') + '</span><button class="btn sm" data-pk="' + k + '">Cambiar</button>').join('');
  $('padRows').querySelectorAll('[data-pk]').forEach(b => b.onclick = () => { padCapture = b.dataset.pk; rawPrev = new Set(rawNow); paintPadRows(); });
}
function padSnapshot(now) { for (const k in now) padPrev[k] = now[k]; }
function padScreenTick() {
  const on = [...rawNow];
  $('padLive').textContent = on.length ? 'Estás presionando: ' + on.map(padSym).join(', ') : (navigator.getGamepads && [...navigator.getGamepads()].some(g => g) ? 'Control conectado ✔ — presiona un botón para ver su número' : 'Conecta el control y presiona un botón…');
  if (padCapture) {
    const fresh = on.find(i => !rawPrev.has(i));
    if (fresh !== undefined) {
      const m = JSON.parse(JSON.stringify(padMap()));
      for (const k in m) m[k] = (m[k] || []).filter(i => i !== fresh);
      m[padCapture] = [fresh]; save.pad = m; persist(); padCapture = null; play('star', 0.3); paintPadRows();
    }
  }
}
function openPad(from) { padFrom = from; padCapture = null; setState('pad'); paintPadRows(); }
$('btnPadT').onclick = () => { initAudio(); openPad('title'); };
$('btnPadP').onclick = () => openPad('pause');
$('btnPadAuto').onclick = () => { delete save.pad; persist(); padCapture = null; paintPadRows(); };
$('btnPadBack').onclick = () => { padCapture = null; setState(padFrom); };
function paintMute() { $('btnMute').textContent = save.muted ? '🔇' : '🔊'; }
$('btnMute').onclick = () => { save.muted = !save.muted; persist(); paintMute(); initAudio(); syncMusic(); $('btnMute').blur(); };
paintMute();
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.btn, .hbtn')) { initAudio(); play('click', 0.5); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); syncMusic(); });

/* ---------------- Bucle principal ---------------- */
let last = performance.now();
function frame(now) {
  let dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!(dt > 0)) dt = 0.001; // protección: tiempos raros del navegador
  pollPad();
  if (L && (state === 'play' || state === 'win')) {
    const n = Math.max(1, Math.ceil(dt / (1 / 100)));
    for (let i = 0; i < n; i++) step(dt / n);
    if (state === 'win') { winT += dt; if (winT > 1.9 && !winShown) showWin(); }
  }
  if (L && state !== 'title' && state !== 'select') render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Ganchos para pruebas
window.__game = { get followers() { return followers; }, hitBlock, get P() { return P; }, get L() { return L; }, get state() { return state; }, get hearts() { return hearts; }, get stars() { return starsGot; }, get eco() { return ecoDone; }, keys, press, release, startLevel, beginPlay, step, findTarget };
