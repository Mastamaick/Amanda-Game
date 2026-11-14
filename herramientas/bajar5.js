// Baja los clips de animales nuevos y del minijuego de vocales; 92% de velocidad; actualiza lista.js
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const B = 'https://elevenlabsusercontent.com/database/workspace/c9a37d14a4cc4d0fb2c99826e8832697/content_generation/';
const E = '/content.mp3?Expires=1794632400&KeyName=assets-cdn-key-1&Signature=';
const L = {
  en_elephant: 'If4dfiWHCaSum6gC3aXh/IewsO0OQhMNGJejgstuJ|CmXsEQSIyPE1ByYcchUp2yJfRyU=',
  en_giraffe: '1xxV44qvYUmzUDpqZIRB/HChCYCP9P8zWM0Ox9WPo|WIdafTAmLp6Gubv0BXV17czuPkg=',
  en_lion: 'rmjLqvVEjOciodPiN1He/5kzu9dV3hLm0Uy1HjLU9|xLx7dLO_vTam3UWm6hYawVj4ucA=',
  en_monkey: 'kM7yTOxTeYlQ2OPkWUlu/8VwlrSFqLuugif8R0kWD|IY8frvSXZBAAQCe2_YfWBQvJip0=',
  en_panda: 'WSjUvwxKLgGpJLizlL0P/K6WGoqbjl5p1r9RNcvbL|m1aFKOIgog4_A8O6jNTR5CM2qWI=',
  en_penguin: 'bAH9PQEeC7ga06PSxzwr/RQIGoarCXHFpcXRjwmf6|tqM9Cy9RoU--vKay8YGrRfE7Dek=',
  en_koala: '7W3TzsP9RhovrbGI1nkW/tigjKaHMkwM9EMsnLqRS|lml7u82rqyKL26tXNLMa2jmS8KA=',
  en_zebra: 'CMLfNuxR6YrqdQP73im8/90y3PpOOjqvIh7jaxcmA|Dl5Ga61oy6-NtPbm9ISYpGsu8H4=',
  en_hippo: 'XxvdBcHIL2M8vcxSVx94/OG3aIiLBGV4Rxzlh5WEe|KF78V3a0LVGbGVcdxd0mpH6X2r4=',
  en_kangaroo: '6jvESqyZvCFaJpOoRqjB/eXTTEqGk21mejPc5SMtu|UuHsSP8iZWEC-ughGjYy4gz9EIM=',
  en_flamingo: 'h9wCyN4l0lYnvTIoy6e5/i51dODfSplj3YKx0xZFe|iGPbA2XO38sRXYpMi3kEyb941ao=',
  en_parrot: 'ECJ17zgPHd3mOHQE8pJk/NoOn3iMUvYI45g0yloh3|RM8Zkvqpy7aO6gT40ByR5CBfOyk=',
  en_seal: 'KNIqI0DkJnKK0wPssxeR/Q6Te8pKPj0HUGdQqsGB2|Y7oeWGHXDqIQ8tgQa6MqF71vmSc=',
  en_octopus: '5qXwPy0irKMupm13Okoa/NXUqSbrgsUL2yOKEEF5u|Qb4xmhFbfp3hzvd4jpiBtvVr6s4=',
  en_dolphin: 'Ut7VLfw9SUbkMoQGXfOj/YWp12yWh4cqBs6jAzcck|UHL9ay9ylp1l2srmLJS34p-JcB8=',
  en_bear: '8X55q4llbcd5xQ5cLtz3/TCRJtAiCrdLjE8mmY6YF|aES-4re5ZDxh7-nfYQVLEUQNddg=',
  vw_abeja: 'ZKuVkANs3VnTiQzPkOpk/99p7UQuHurSKy2E41UZ1|bSFNDAPQxM4kx430UcxCx4ZEJig=',
  vw_ardilla: 'dyoGQ9g11un0vx635lv2/nE2BTc8ACIoNYtZFZ1Is|22dwMtujuoZCnffvXEFdcvwsgqc=',
  vw_arbol: 'X0JU5DbobobUoqZFQQdj/gXzIvDRwDj4p7J8XjG3m|u3eHE0ViYueYYrGP-e_11M32d9M=',
  vw_arcoiris: 'Vas6mDVdrPdjxUNpcOsy/Cqm8LtEWiy5DPQUX0CqI|B8_vi4ChbrmbSpQGOlj1y4XeoMw=',
  vw_avion: 'sCHZJpedrVCrO00wWeSc/OzieY05dIBYI0d4fjOKF|0xdZGMvX3qfLuJh4_6uP6Solgyo=',
  vw_anillo: 'hvLxM2dSTLDXTiKYwWaX/b1QuoZQ1drWG97aoHg81|qn53st7YNA_zxETXiGQ1HUWxedM=',
  vw_erizo: 'UOckCXhDNlj3PrjZhGSi/Kg44X4CHqpqgYiM9YUVT|OOyV0fa8aism_PZJiB5JmkXUfRo=',
  vw_estrella: 'xRxkrYyuu40nAcR2eFhy/DuNRmEoqbq9hIUzZBK1t|s0812nIK60hzc3uNBneirU0BVR0=',
  vw_elefante: '7nrp5BTMsQxMualWszWR/dKC3QpzZYWmsPGa16uhf|atfD-P-gpbYx6fJs_bF8E10axx4=',
  vw_iguana: 'QLWLFFFMhwPutZRHORCF/ug3FY8smX43HdGBOIrma|o5xt9QoC6U-5CgzdugrXFZaGg3k=',
  vw_iglu: 'qpMmrcUh79ZpA207AUxf/X9Tt00BdeqUBzdIYNuru|G7gbY7_26dxB7wLZ5ozFfxf44pg=',
  vw_isla: 'Y6t8A1kd0TBEYlP1qSWh/oiF829OExqjedEfZE3fS|truUkAp29XcHuGF_U5Owz8vL3dc=',
  vw_oveja: 'AUL37HI6CXGzgCVFof1Z/h2UG44U2w67DXv3k3uhs|QA4aoLMljDpqRh2uXYcJNmiRDIo=',
  vw_oso: 'KmcSsJrHWYQxfrcg9pqM/JxY8o6H1B9PK4Ku35IFv|61gy301uMQbDDK0Vowut-LCXLec=',
  vw_ola: 'RSabF2fZFXBYxgyjvIQE/2h36nk7fcdhIK4wuCPvP|9JWzLJdHMkXAmwW0zKvch9peJO8=',
  vw_ojo: 'ya3SENElmvkZjBSAIX8w/HjTNqxxH6VF5FL0bxwvt|loIO5OFgVzq8aTFOH-FnZMlV8eE=',
  vw_oruga: 'LYBwhBO02vMydh1GucEp/07PZ6jEbXoeCkeN28VDP|B0jWEGtcbb74m63mBY_th51ATJA=',
  vw_uvas: 'MAdgNlPHr8A9IVJbejo6/VFfmQo7mBUvarHPRGZYH|dEIISkVZN0deZq_fxT8OJgNwM24=',
  vw_unicornio: '2QvwrC4xoDQAgxdoqSZz/WrUESsX9kxFOwOV7wsV4|jj5nmBA9o5VbS-VQdwFJgpkoax8=',
  mg_intro: 'CbdklsWv4vMfnmupWx21/v0rtgwW06FaDy7aaO2K6|aUqAHN52-B2TL4VCBsz322pwPV0=',
  vl_a: '4FBKYhPnkdsFx9taCXQa/yrgnlPGycyIStpK2WCq7|lFJ2xZLgQHF1keXtDAYgZxv9QzM=',
  vl_e: 'mjVgvDTArFYklmMCaORw/3q0Gs0iSKVT4I7teItGq|E9fTfoiE-uDVT5SGpji6tu2c2dQ=',
  vl_i: 'FeSgqIQGPuvzJDQRbQMV/4dAfkV9V1E1okUb2K99H|9RixyKA-UsRyqPfLzjUKi_A02Hk=',
  vl_o: 'JhSWCuoGFXuX9puclWhE/lqZdRCA8k9cGuNaZoQvX|aLhIhSdqbVMdlrVySCd8NiBph-A=',
  vl_u: 't5WDj1sSQKoUkU8z6Tvu/MfTOWNKm3BrOTtLZeKbD|oY7BW16bppocYiJutIr4mwJyTNY=',
};
const raw = path.join(__dirname, 'en5'), out = process.argv[2];
fs.mkdirSync(raw, { recursive: true });
for (const [k, v] of Object.entries(L)) {
  const [p, sig] = v.split('|'), r = path.join(raw, k + '.mp3');
  execSync(`curl -s -f -o "${r}" "${B + p + E + sig}"`);
  // las palabras en español del minijuego no se aceleran ni frenan tanto: 0.95; inglés 0.92
  const t = k.startsWith('en_') ? 0.92 : 0.95;
  execSync(`ffmpeg -y -loglevel error -i "${r}" -af "atempo=${t},volume=1.15" -ar 44100 -b:a 96k "${path.join(out, k + '.mp3')}"`);
  process.stdout.write(k + ' ');
}
const lista = fs.readdirSync(out).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(out, 'lista.js'), 'window.VOZ_LISTA = ' + JSON.stringify(lista) + ';\n');
console.log('\nclips:', lista.length);
