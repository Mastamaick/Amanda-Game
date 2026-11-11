// Guion completo de la voz compañera. node guion.js -> imprime los textos por lote (es / en) con sus claves.
const N = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
const es = {
  intro0: '¡Llegamos al jardín, Amanda! Vamos a cuidarlo juntas.',
  intro1: '¡Mira, la playa! Hay que dejarla limpiecita.',
  intro2: '¡Qué lindo bosque! Los animalitos nos necesitan.',
  intro3: '¡Bienvenida a la granja! Ayudemos a los animalitos.',
  intro4: '¡El lago! Cuidemos el agua y a sus amigos.',
  intro5: '¡Subimos a la montaña! ¡Tú puedes, Amanda!',
  p1: '¡Muy bien, Amanda!', p2: '¡Excelente trabajo, Amanda!', p3: '¡Bravo! ¡Lo hiciste genial!', p4: '¡Qué bien cuidas el planeta!', p5: '¡Eso es, Amanda!',
  e_vamos: '¡Vamos, Amanda, tú puedes!', e_casi: '¡Casi! Inténtalo otra vez.',
  q_puerta: '¡Una puerta mágica! El búho tiene una pregunta.', q_busca: 'Escucha la palabra en inglés, y busca el animalito.',
  eningles: 'En inglés se dice...',
  h_basura: '¡Uy, basura! ¿La recogemos?', h_basurero: '¡Un basurero! Vamos a botar la basura.', h_flor: 'Esa florcita tiene sed... ¿la regamos?',
  h_amigo: 'Ese animalito está triste... hazle cariño.', h_hongo: 'Un hongo dormido... si lo riegas, ¡crece!', h_crecio: '¡Mira cómo creció! Salta encima.', h_arbol: 'Aquí podemos plantar un arbolito.',
  amigo: '¡Ahora es tu amigo, y te acompaña!', p_todo: '¡Ayudaste a todos, Amanda!', w_win: '¡Lo lograste, Amanda! Gracias por cuidar el planeta.',
};
for (let a = 1; a <= 8; a++) for (let b = 1; a + b <= 9; b++) es['qa_' + a + '_' + b] = '¿Cuánto es ' + N[a] + ' más ' + N[b] + '?';
for (let a = 2; a <= 9; a++) for (let b = 1; b < a; b++) es['qs_' + a + '_' + b] = '¿Cuánto es ' + N[a] + ' menos ' + N[b] + '?';
for (let n = 0; n <= 10; n++) es['ans_' + n] = '¡Es ' + N[n] + '!';
const words = { bunny: 'Bunny', cat: 'Cat', dog: 'Dog', bird: 'Bird', turtle: 'Turtle', duck: 'Duck', squirrel: 'Squirrel', frog: 'Frog', hedgehog: 'Hedgehog', fox: 'Fox', deer: 'Deer', owl: 'Owl', cow: 'Cow', pig: 'Pig', lamb: 'Lamb', chick: 'Chick', hen: 'Hen', foal: 'Horse', goat: 'Goat', llama: 'Llama', beaver: 'Beaver', raccoon: 'Raccoon', mouse: 'Mouse', chinchilla: 'Chinchilla', sunflower: 'Sunflower', tulip: 'Tulip', daisy: 'Daisy', rose: 'Rose', butterfly: 'Butterfly' };
const en = { en_recycle: 'Recycle!', en_water: 'Water the flower!', en_plant: 'Plant a tree!', en_pickup: 'Pick it up!', en_greatjob: 'Great job!', en_hello: 'Hello!', en_find: 'Can you find the...' };
const animals = ['bunny', 'cat', 'dog', 'bird', 'turtle', 'duck', 'squirrel', 'frog', 'hedgehog', 'fox', 'deer', 'cow', 'pig', 'lamb', 'chick', 'hen', 'foal', 'goat', 'llama', 'beaver', 'raccoon', 'mouse', 'chinchilla'];
for (const k in words) en['en_' + k] = words[k] + '.';
for (const k of animals) en['ef_' + k] = 'Can you find the ' + words[k].toLowerCase() + '?';
module.exports = { es, en };
if (require.main === module) console.log(Object.keys(es).length, 'es /', Object.keys(en).length, 'en');
