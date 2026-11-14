// Baja los clips del minijuego de comida (fd_) y los números 11-15 (num_); ajusta velocidad; actualiza lista.js
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const B = 'https://elevenlabsusercontent.com/database/workspace/c9a37d14a4cc4d0fb2c99826e8832697/content_generation/';
const E = '/content.mp3?Expires=1794679200&KeyName=assets-cdn-key-1&Signature=';
const L = {
  fd_carrot: 'aogK9jPtd7WLdP3fLysW/E1Elvz2qz28rE8cfJuy3|ELX1fm-IteMRBByyBDgd1RcfRxE=',
  fd_broccoli: '4jqhnITW6CmPvrFvdCaJ/vMzYChhADW8jnIPEUa9i|MZWT43jqOE-hZ8P8YjqaFNJYM-M=',
  fd_tomato: 't5XtSKEnO7Ch4FshGer7/7bjyP0ALzFxEqjmZZkm1|KaQLDZIe8P2lw5Q7g04nKgFvg_E=',
  fd_corn: 'nq3YZRHpmRqKb9zKEoMg/7JWf0NGzLoI9smUojnPV|1nBp5hAHnFW8MbmpCXG1BheD14k=',
  fd_lettuce: '03l2TgDfRjpX88NEJnAC/le2iNu61Ki4FcPRQEwXL|uG_XG2kpMQnjQENMx5PAyjZXodI=',
  fd_cucumber: 'gM0dBJQRifGAlgxrR19h/MNfS4Lb3imghvzV6Ckyi|jULHJnKLp3WoX_liK4q2R6_-Pv0=',
  fd_water: 'zildJdPH65ccghyQtEDy/TydEMZOf6IZTsY0sm04B|n4wRCkEjckWViPW-9d9n767OU_Q=',
  fd_milk: '3Nc41z3LwNjodINtceIb/1a5jmGKn6cUCn2TtxwiB|Rb_GqQivvHH1vY9yFcW-2j3UYFs=',
  fd_burger: 'o7S0rm2qXTxNI2h3fhmK/qJSdMMEIY5xVI5ne1fF3|z8Ez_fNxqrMP4nOIm6D5g78xZTE=',
  fd_fries: 'QBNwbNhiWvLcU2jh7o6Z/PVb4GfqnbgfhI0qCbvBU|09PMG5q9k326l9CNY3i1C9vQXlM=',
  fd_soda: '14HIWqpXvOMtYEt8ABX3/2ZDTMvUbMrOlmXl3xxZh|ejPd68jzH6j_7NM_7gA2e6ZhVQE=',
  fd_candy: '2tmpmyexHCSlgMdSNbhR/gM1qIO41GfqT1OaT7EGE|eOjrXuPZ65dEDKpVnlvJbm9CzG0=',
  fd_donut: '5x2BqiigRahliQiCnF5a/1j8P7Eui8iFohsbcY8Tj|UGWCsYiig9RWpkPPuUFVObajCsI=',
  fd_chips: 'JeQ1d0IHDHm1eVCkGgmJ/UXDFnoB6LV7an60ptJQy|ej7Aa1FenACu3RTEb7fKz4-2ptk=',
  fd_icecream: 'qC5kfMc7reDHo1s5zMe2/ah9vSmwQkptss3rc2Soc|c-BbagqZI6HOJ5HLuhjvYJR8uCI=',
  fd_lollipop: 'TY27nuA7Hg31s4yZ4jp5/uHBsslkbVEppMjL9Zcic|8bfHEIkTaeQQoXabILmLM-ymsq4=',
  fd_intro: 'McEIy4owMkjvjuOOyQBF/JbZeiXkyAvKqOTivEGRk|7U0vsnbBsLjVLTIh4VzNzp6_DOM=',
  fd_healthy: 'rar5CQHQGrK9ff3GTiJj/JE0Felvye4sc3NwUPW0w|YWyvlMcadhxa7ND5n77_KYUI9vw=',
  fd_junk: 'iloWnNwQFVVarQX4epiv/569WVd9SEUiCFHr0Tq5o|P7Cb2CPawk_o4wXUOtJ5DrjiG0g=',
  fd_lonchera: 'uvjP0dMsNUhPSrYI8uyQ/YzHR0TJ6xubKI7vj68tz|g4L24dlXINHgHW-ZpH0npBbXoCI=',
  fd_agua: 'TgvHVhxV2ftQlxEgWZs4/kLxOw7TgupfK3EDX5dg0|qsbb988Du8lhzxasmTSbZdCJHE0=',
  fd_fin: 'GIVhTN2XHKDxa5wXdQvh/t3JRUGQLvN3nDQ1TuQyn|a-md832t5_kGzDiSFKyuOgobr58=',
  fd_nojunk: 'CFALmXUDhmhIZVhlchmx/IcQDlk6OvdQHnoSRwu2s|Rjat5KUAeiuchS0mj-9xwGgX2pY=',
  num_11: 'DIsedYLADkqHgbNHQLjv/5mKfMK1WmM7nNRCD3eGG|8eRrXPAxt-cwNQivHYWqdWAUFpM=',
  num_12: 'kUE7MZIxD7uC6RmfdhVs/BnDbjzPVUQK1nneOVjkI|rYkNh7cyGTl0v94k5BS4v0synjo=',
  num_13: 'rZbHId3ma3QPHZKfHjgN/yNpUZk9t5QUHutXk53yP|Mke46uI9wNrY4aGaB68I413hzSU=',
  num_14: 'o2jRoaQuX0xrUAES74VP/XKSm135bfvrOXN7Iha5l|jeIUTlWHEYeKX3FS3wvB9XlqmZQ=',
  num_15: 'SGT3ueHQXX7IDB6o9M3T/ILQr1uagXexrvSlANqoF|eDhs_BJwsHEUxgo5NVdixrDn4xU=',
};
const raw = path.join(require('os').tmpdir(), 'voz_crudo7'), out = process.argv[2];
fs.mkdirSync(raw, { recursive: true });
for (const [k, v] of Object.entries(L)) {
  const [p, sig] = v.split('|'), r = path.join(raw, k + '.mp3');
  execSync(`curl -s -f -o "${r}" "${B + p + E + sig}"`);
  const t = k.startsWith('num_') ? 0.92 : 0.95;
  execSync(`ffmpeg -y -loglevel error -i "${r}" -af "atempo=${t},volume=1.15" -ar 44100 -b:a 96k "${path.join(out, k + '.mp3')}"`);
  process.stdout.write(k + ' ');
}
const lista = fs.readdirSync(out).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(out, 'lista.js'), 'window.VOZ_LISTA = ' + JSON.stringify(lista) + ';\n');
console.log('\nclips:', lista.length);
