// Baja los clips de frutas (fr_ español+inglés, fe_ inglés) y de la veterinaria; ajusta velocidad; actualiza lista.js
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const B = 'https://elevenlabsusercontent.com/database/workspace/c9a37d14a4cc4d0fb2c99826e8832697/content_generation/';
const E = '/content.mp3?Expires=1794675600&KeyName=assets-cdn-key-1&Signature=';
const L = {
  fr_platano: 'dVibLgGTtkVNjRXiBUJE/OelqiG7nUkO08pfo22yW|e7QKi-B_BXtLE_y5ehjY2xuRJC4=',
  fr_naranja: '0mrl9PXUJpeKtuIumShe/RPFsKmpCdD0B6hg9WHVN|zC4sOxZi-W4Uox3BKRQPHP9LU4o=',
  fr_frutilla: 'SpBrwpdKdguXbUWaUlz1/n0xTNLW7kLzABnD575mQ|T-V36VUMXIqy9iKbmNAOBMSAX8s=',
  fr_sandia: 'LPQygwgLbQxKxK9nbSS0/wYtd5wUf7RzSsrcc406z|xh5WqIiYVQP5G99Brc1CPb0RvBc=',
  fr_pina: 'oXs4LoX2AD3fCNRQjvp5/31G4N1bXmlBxys74Q4pj|LHr3JiLIqdz8YvDaILbA30B9gJ8=',
  fr_pera: 'm2KU04Z9IKeeUPiDVtpk/M2G16PHezehAyGVjuHyO|LWKRyx2Cgvpxs3x6wLZ3MpcBlI4=',
  fr_cereza: 'eE9M49ZZuGcvK7CeJ3Eh/i0TurHX1vsIdpJP7xAP4|5xJM-c4bdQMesv8MW7Y9e99GDEE=',
  fr_limon: 'ekx4FGkPkmYdxc2iYtQ4/HezBvg5VQKyxSN0U6srS|eFvAB_EAPby_ixeqFkJmTpisQD8=',
  fr_durazno: 'N7A1W4kmS0i4jeHh6HGo/vceVXZjrWlLeCsmq59Hn|eWv5u_KjjEddkKc-namQFJwRBJM=',
  fr_kiwi: '98GtCEewfdlfmmp9vJAR/sxDElAELpxtT3WDfPHFB|sgt0gtPnlPOkfi6pCTJkpscK0lE=',
  fr_mango: 'wqsshZgXdFg78rmmBswf/Ph9TGdlgJv5r5t8r9Ytk|nJID5ZYU_UK0XwmBtWeA85P8EIg=',
  fr_coco: 'KdF1mzqnlksxLvBVdKtM/ALzhMCmX4RnTLeF35qJH|UHz6UDSlUeeJPs_NbLsFkR3eArU=',
  fr_manzana: 'Ciu7Hm2I6SeYLp91NEyd/ekhU6Sne2fJZhsWrzwLq|RqpAiSlbvAbq7JXlwEl2JTq_W2Q=',
  fe_platano: 'ys1FpbI38oMR9yRdTQOM/JyIqu2NAVT0KF4IGifGR|dREoQ29uZl5hCmDm0g3uXcxU9gM=',
  fe_naranja: 'XQLspBEWbXp92EH9WKuG/lSKx2g0CH81n6CcBQ5WB|OPqe1Rzii4zsO4T_pHaLtAoYoko=',
  fe_frutilla: 'gcfxWwUc5kFX0rFiCjlu/C1zCJ5j4AbwdYrWj5Sj1|-Y9QP530KmCcQQhGs13rlCkjtFM=',
  fe_sandia: '5TanqMAkq58hLnUWmz9u/gTzzOU49ylcBhUxAdU2z|qhpuMwvFOAs9Uevqp9vxw_md730=',
  fe_pina: 'YIi5EwPUZw9bCxW8r4aD/A1ogYnfGTP2TY5BKho2p|gV30XRceHcE-UwUjlUIwH1Qh59M=',
  fe_pera: 'XDwU3sOtWvW0EGWkZMrI/lZmaSKtyyrJqZlJwgooe|3_Ba1aFFiboHMM_RIGDOXi9yTVk=',
  fe_cereza: 'PUF0M0Z2M8cjHbLMvWEG/Ml3TW0GaTOYshN0cmiQn|SKi76tuZuv5-kgRZKDM5dWX0h5k=',
  fe_limon: 'ycoyvrIxLgRBfsCmadfd/yQ7txJOixNcDmnnoWZcA|du1u2ipGO19rrhap3AnDVYIgQX4=',
  fe_durazno: 'lgxgIzM4lb03g4M8FGM3/jnhrOoIV8Aqa1uSBRpEO|hWkJp4xiT-1zlBZUzivWFmXUGok=',
  fe_kiwi: 'Webe6B343ORlPu66BwTC/OPH7gRkJoIcRPKOFZnR1|R3aZFtT0NaMwO1e46v_3rA7kJ-g=',
  fe_mango: '5X1qWV6930TXNf0vwRGM/ad8q5KbP5L7C1rU8lX5W|TWcmFQirnqPQPwSwTWGNU14qjhk=',
  fe_coco: '0r40TDGxm4cdYV1NpWFf/0iRcmfKyr3lVcrq7ZIh4|4NmkhrhHTEdDBdNeQyjQR0BjB4Y=',
  fe_manzana: 'ow0tfDNYFLNcFutftLkW/PBJOGUWoVXj8hY4GNMuq|x3d1YgSCS0Nx5XHM-eC3ID9Wms4=',
  fe_uvas: 'SA57Yj6Wg2e8Uv18YxiU/5gGBitkJgYp4WfZo5QBA|TzT_Bx4UVVTaIoHCzx0xnAXvhHA=',
  vet_perro: 'JMA15WYiQlFcgXvt3yoU/yxaPe8aXpU4DqZo4oyqR|1dEXol4OA2-5XH7IgqrpWD7IMho=',
  vet_gato: '66E0piv0WRdueztgchqE/yn52SeRs2jlSC9wNYVFJ|0bX_-Ky4KcS6mzU_94BumP1kts4=',
  vet_sucio: 'Lj7iHIYZwKZQRWQe82sR/LJ1jbzfnpqAg6Epeubc1|jmwpgr1xYPqhBumbqcjP4tPgVOg=',
  vet_ducha: '6yYgFrTVR5WO03mqJRnX/d1pVJIdkVl33nruwF3zN|ebwgooL5-Rut_yBbQHxg9w_jOC4=',
  vet_inyeccion: '7PrSWDv8zXuaxgoUcerb/SniQKFTLhQ1Rk7q2jGLI|dBnTf5TtPzXhXUVg34uOjfFv5d4=',
  vet_sano: 'Eh1qQ67aEumaWmfgNvep/EoPGzAqV57vOe0GAGTpo|Ln8Mt1LNoWxlrsO1HkuyZun7JpA=',
  vet_esa_no: 'gvsyFx4M7BWCQ0y0Le65/RomewVoc2XCNW0o1o0OM|JCKr2wLqBnYKPnsBEYQM09ZppEc=',
};
const raw = path.join(require('os').tmpdir(), 'voz_crudo6'), out = process.argv[2];
fs.mkdirSync(raw, { recursive: true });
for (const [k, v] of Object.entries(L)) {
  const [p, sig] = v.split('|'); if (!sig) { console.log('\nSIN FIRMA:', k); continue; }
  const r = path.join(raw, k + '.mp3');
  execSync(`curl -s -f -o "${r}" "${B + p + E + sig}"`);
  const t = k.startsWith('fe_') ? 0.92 : 0.95;
  execSync(`ffmpeg -y -loglevel error -i "${r}" -af "atempo=${t},volume=1.15" -ar 44100 -b:a 96k "${path.join(out, k + '.mp3')}"`);
  process.stdout.write(k + ' ');
}
const lista = fs.readdirSync(out).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(out, 'lista.js'), 'window.VOZ_LISTA = ' + JSON.stringify(lista) + ';\n');
console.log('\nclips:', lista.length);
