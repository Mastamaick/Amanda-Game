// Baja los clips nuevos (colores y números), los pasa a 92% de velocidad y los deja en assets/voz2
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const B = 'https://elevenlabsusercontent.com/database/workspace/c9a37d14a4cc4d0fb2c99826e8832697/content_generation/';
const E = '?Expires=1794610800&KeyName=assets-cdn-key-1&Signature=';
const L = {
  fc_find: 'kOpgj3yVCKor9hkyvOf8/qoLQI8rwDAIpreeCMrKG/content.mp3' + E + 'm0gpCNKSOsSJzBMhJucnlFQyg80=',
  fn_find: 'RHPmMbgiWUWMTsaGTxIM/kWZO2beQ2KcA5Ecn6bgh/content.mp3' + E + 'ivLDNiAz85lajlTm1hbaaQr8u_g=',
  col_red: 'eZW2Tns0irlafjPTkKeu/cgqtDzkyVlr3CggLzOjO/content.mp3' + E + '43Do8XI5Xjca8Tbt3NFhYABmubE=',
  col_blue: 'WkircGKYSkIz3hDWr9lh/faWk5dd8lJDlX3tZDFG2/content.mp3' + E + 'A8M6LK0Q5vWBhv6-xz4CUndxc2I=',
  col_yellow: '1bhuayV5H1iimWb1L07p/EkcWW165KncjYEBB3aaA/content.mp3' + E + 'eF_SIGISQ84oYZegN2pi2XIrOj4=',
  col_green: 'RRBoA1Wp5ipdEGIQNGmE/BqRsJyO2UQpshTIuP5xG/content.mp3' + E + 'nuNuJaXTlHDNJDKGWATdBY24Xcg=',
  col_orange: 'y45VzEwyCJjUBjbe0tvc/0bSBtiiI2MD31S0VHjtN/content.mp3' + E + 'BJOtNyXBXGIgD-sGr7bQwaiAOHM=',
  col_purple: 'eXRgbMzlHKLgEkSVCQ4M/GQ1J4xBNuLPNTH91PU7u/content.mp3' + E + 'ajNvQlm4BsZcNyVYmMsjciFZ6PM=',
  col_pink: '6R4wNzLqVFGYPJ6KFPyO/oc4GCFt2BhNm3FcQywML/content.mp3' + E + 'jZwpTV_B6b8_ikinOnpfEqjoV0M=',
  col_brown: '3FlWAeH5WFwc3HzkVCij/SKGPjl3Y4E9Tk8YJLV0T/content.mp3' + E + 'PRc4ZtyvyYNW-WyiO8XcySCIs7M=',
  num_1: 'Qc3eAY0elNmVJMitUcO8/h5p4KDO1i9Umi7q6tGB2/content.mp3' + E + 'RID3wGOUDWEMoZzIjEZGZrbliNg=',
  num_2: 'dcYcrPbmEAB8jT2iF3Oy/jyhkKUMfn9Xst19ErznW/content.mp3' + E + 'ZCMlO2akv-xMIIWnfmIGR1krInU=',
  num_3: 'uCBDHvEn5UYfoPzpDEJd/T8J5Q0WHRgvqk8OFzaRa/content.mp3' + E + '-CWds3z1V5KaAzSesUQ3BTStGPY=',
  num_4: '0LFApqruV0FyG4lxgaSq/bK2rhTCxwCpI8DRH8bME/content.mp3' + E + 'Pk6p7CHpnyzGyUy3BqO8fCQ2fLc=',
  num_5: 'ijUxsEq1RDYGVu8i8bGx/6Ny42YPm2EKnTl0Y04ZE/content.mp3' + E + 'MxWaoQACiJ2dJVStlVN2t09wq9g=',
  num_6: 'UYDkzJAQVXWIh8aZNacr/rC4KJthGLTO0SaEZ2n5E/content.mp3' + E + 'tJ4c69v5fNfWphX2n26ssaGw1qE=',
  num_7: 'd2prpRb9GtMycwiaNizy/plqLIwBVpkuuF76N60oO/content.mp3' + E + 'Hx3V0UIfpF5whGkn59lHiJpUsUs=',
  num_8: 'rlB7LvvhGw974e5fgIis/UYMlfXUYE7lJFvGQ6TNz/content.mp3' + E + 'mrUlljgpS6cZ3Ufh9Tp0VcFNEaM=',
  num_9: 'tmu753iReciPHrl5eXxG/LFHdWcAvdoKpTjADKGzW/content.mp3' + E + 'JzdGEbEAMCmaJpCL3fualTYBw8Y=',
  num_10: '72xWaVwgYibj7dbV1RAz/3BXcsyJ4d1ZK1JTLaV3O/content.mp3' + E + 'YE9ZO_HsqxFshCaOaeRCg8UM-YM=',
};
const raw = path.join(__dirname, 'en4'), out = process.argv[2];
fs.mkdirSync(raw, { recursive: true });
for (const [k, u] of Object.entries(L)) {
  const r = path.join(raw, k + '.mp3');
  execSync(`curl -s -f -o "${r}" "${B + u}"`);
  execSync(`ffmpeg -y -loglevel error -i "${r}" -af "atempo=0.92,volume=1.15" -ar 44100 -b:a 96k "${path.join(out, k + '.mp3')}"`);
  process.stdout.write(k + ' ');
}
// lista de clips disponibles
const lista = fs.readdirSync(out).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(out, 'lista.js'), 'window.VOZ_LISTA = ' + JSON.stringify(lista) + ';\n');
console.log('\nclips:', lista.length);
