/* --- Voces (ElevenLabs) ---
   La voz es una compañera: felicita a veces, avisa cuando ve algo nuevo y enseña palabras en inglés,
   pero NO narra cada acción. Clips nuevos en assets/voz2/<clave>.mp3 (lista en VOZ_NUEVA);
   mientras falten, se usan los antiguos de assets/voz o se salta la frase. */
const VOZ_NUEVA = new Set([]);
const VOZ_VIEJA = { p1: 'muybien', p2: 'excelente', p3: 'super', p4: 'muybien', p5: 'excelente', e_vamos: 'tupuedes', e_casi: 'casi', q_puerta: 'puerta', w_win: 'lograste', p_todo: 'gracias', eningles: 'eningles', q_busca: 'busca', intro0: 'intro0', intro1: 'intro1', intro2: 'intro2' };
const VOZ = {}; let vozQ = [], vozCur = null, talkCD = 0;
function clipSrc(k) {
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
