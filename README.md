# La Aventura de Mandy

Juego de plataformas para Amanda (5 años): recoger basura, reciclar, regar flores y hongos, plantar árboles y hacer cariño a los animalitos, mientras aprende sumas y restas menores a 10 y palabras en inglés.

## Cómo jugar

Necesita [Node.js](https://nodejs.org).

```bash
node servidor.js
```

Luego abrir http://localhost:8123 en el navegador.

- **Teclado:** flechas para moverse, espacio para saltar, H para ayudar y G para saludar.
- **Control USB (PlayStation):** cruceta o palanca para moverse, ✕ saltar, ○ ayudar (recoger, regar, plantar, acariciar), △ saludar, Start pausa. Si un control usa otros botones, se cambian en el menú **🎮 Botones del control** (pantalla de inicio o pausa).

## Niveles

1. El Jardín
2. La Playa
3. El Bosque
4. La Granja
5. El Lago
6. La Montaña

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `index.html`, `game.js` | El juego (canvas + JavaScript sin dependencias) |
| `servidor.js` | Servidor local en el puerto 8123 |
| `assets/` | Sprites de Mandy, hojas de stickers originales |
| `assets/bichos`, `assets/cosas`, `assets/fondos` | Animales, flores, basura, entorno y fondos |
| `assets/voz2` | Voz compañera (ElevenLabs, voz Tilly) + `lista.js` con los clips disponibles |
| `assets/voz` | Clips antiguos usados como respaldo |
| `assets/audio` | Música y efectos |
| `herramientas/` | Guion de voces y scripts usados para cortar audio y recortar sprites |

El progreso se guarda en el navegador (`localStorage`).
