// node cortar.js <mp3> <indice_lote> <carpeta_salida> [saltar_primeros] [tempo]
// Busca las zonas con voz (separadas por silencios >= 0.35 s). Deben ser exactamente tantas como frases.
// Si sobran zonas, une las que estén separadas por los silencios más cortos.
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const [src, idx, outDir, skipS, tempoS] = process.argv.slice(2);
const skip = +(skipS || 0), tempo = +(tempoS || 1);
const lote = JSON.parse(fs.readFileSync(path.join(__dirname, 'lotes.json'), 'utf8'))[+idx], keys = lote.keys;
const out = execSync(`ffmpeg -hide_banner -i "${src}" -af silencedetect=noise=-38dB:d=0.3 -f null - 2>&1`).toString();
const st = [...out.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]), en = [...out.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
const dur = +out.match(/Duration: (\d+):(\d+):([\d.]+)/).slice(1).reduce((a, v, i) => a + v * [3600, 60, 1][i], 0);
let regs = [], a = 0;
st.forEach((s, i) => { if (s - a > 0.08) regs.push([a, s]); a = en[i] === undefined ? dur : en[i]; });
if (dur - a > 0.08) regs.push([a, dur]);
regs = regs.slice(skip);
while (regs.length > keys.length) { // unir por el hueco más corto
  let bi = 0, bg = 1e9; for (let i = 0; i < regs.length - 1; i++) { const g = regs[i + 1][0] - regs[i][1]; if (g < bg) { bg = g; bi = i; } }
  regs.splice(bi, 2, [regs[bi][0], regs[bi + 1][1]]);
}
if (regs.length < keys.length) { console.log('FALTAN ZONAS', regs.length, 'para', keys.length); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const tf = tempo !== 1 ? `,atempo=${tempo}` : '';
regs.forEach(([s, e], i) => execSync(`ffmpeg -y -loglevel error -i "${src}" -ss ${Math.max(0, s - 0.06).toFixed(3)} -to ${(e + 0.12).toFixed(3)} -af "afade=t=in:d=0.02${tf},volume=1.15" -ar 44100 -b:a 96k "${path.join(outDir, keys[i] + '.mp3')}"`));
console.log('lote', idx, 'OK', keys.length, 'frases');
console.log(regs.map((x, i) => keys[i] + ':' + ((x[1] - x[0]) / tempo).toFixed(2)).join(' '));
