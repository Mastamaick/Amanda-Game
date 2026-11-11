// node cortar2.js <mp3> <indice en lotes_en.json> <salida> [tempo]
// Corta usando los N-1 silencios más largos y avisa si la diferencia con el resto no es clara.
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const [src, idx, outDir, tempoS] = process.argv.slice(2), tempo = +(tempoS || 1);
const keys = JSON.parse(fs.readFileSync(path.join(__dirname, 'lotes_en.json'), 'utf8'))[+idx].keys;
const out = execSync(`ffmpeg -hide_banner -i "${src}" -af silencedetect=noise=-40dB:d=0.12 -f null - 2>&1`).toString();
const st = [...out.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]), en = [...out.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
const dur = +out.match(/Duration: (\d+):(\d+):([\d.]+)/).slice(1).reduce((a, v, i) => a + v * [3600, 60, 1][i], 0);
const gaps = st.map((s, i) => ({ s, e: en[i] === undefined ? dur : en[i] })).filter(g => g.s > 0.1 && g.e < dur - 0.05).map(g => ({ ...g, d: g.e - g.s }));
const sorted = gaps.slice().sort((a, b) => b.d - a.d), cut = sorted.slice(0, keys.length - 1), rest = sorted.slice(keys.length - 1);
const minCut = Math.min(...cut.map(g => g.d)), maxRest = rest.length ? rest[0].d : 0;
console.log('lote', idx, 'frases', keys.length, 'silencios', gaps.length, '| corte mas corto', minCut.toFixed(2), 'vs mayor interno', maxRest.toFixed(2), minCut > maxRest * 1.25 ? 'OK' : 'DUDOSO');
if (gaps.length < keys.length - 1) { console.log('FALTAN SILENCIOS'); process.exit(2); }
cut.sort((a, b) => a.s - b.s);
const lead = (out.match(/silence_start: 0\b[\s\S]*?silence_end: ([\d.]+)/) || [])[1];
let a = lead ? +lead : 0; const segs = [];
for (const g of cut) { segs.push([a, g.s]); a = g.e; } segs.push([a, dur]);
fs.mkdirSync(outDir, { recursive: true });
const tf = tempo !== 1 ? `,atempo=${tempo}` : '';
segs.forEach(([s, e], i) => execSync(`ffmpeg -y -loglevel error -i "${src}" -ss ${Math.max(0, s - 0.05).toFixed(3)} -to ${Math.min(dur, e + 0.12).toFixed(3)} -af "afade=t=in:d=0.02${tf},volume=1.15" -ar 44100 -b:a 96k "${path.join(outDir, keys[i] + '.mp3')}"`));
console.log(segs.map((x, i) => keys[i] + ':' + ((x[1] - x[0]) / tempo).toFixed(2)).join(' '));
