# Nuestro octubre

Un calendario de películas para compartir: 31 sorpresas, ilustraciones originales en SVG y una tarjeta con colores, motivos, snack y dedicatoria para cada noche. La edición inicial es octubre de 2026, con fecha de Ciudad de México.

## Abrir

Necesitas Node.js 20 o posterior. No hay dependencias que instalar.

```sh
npm run dev
```

Abre la dirección que indique el servidor (por defecto, http://127.0.0.1:8000). Para parar el servidor, usa Ctrl+C. No abras `index.html` con doble clic: los módulos necesitan un servidor HTTP.

```sh
npm test
npm run build
npm run preview
```

`build` prepara los archivos estáticos en `dist`. `preview` los sirve en el mismo puerto; detén primero el servidor de desarrollo. Puedes cambiar el puerto con la variable de entorno `PORT`. El servidor usa solo la interfaz local por defecto. No se ha publicado el sitio.

## Personalizar

- `src/config.js`: año de la edición y zona horaria. Conserva `month: 10`; las 31 películas están preparadas para octubre.
- `src/movies.js`: títulos, dedicatorias, snacks y paletas en el orden exacto de los días. Incluye solamente **Twitches Too**, no Twitches original.
- `src/art.js`: las 31 ilustraciones de cada película.
- `src/styles.css`: estilos y adaptación móvil; tipografías con alternativa local si Google Fonts no está disponible.
- `src/halloween.css`: pantalla principal negra, blanca y naranja.
- `src/cinema.css`: tarjetas con diseño de entrada de cine, cartel y sello temático.
- `src/posters.js`: portadas locales, años y enlaces de procedencia. `assets/posters/credits.json` documenta las 31 fuentes.

## Fechas y progreso

- Antes del 1 de octubre de la edición, todas las casillas permanecen bloqueadas.
- Durante octubre, se puede revelar hoy, mañana y cualquier día anterior. El día 1 permite 1 y 2; el día 2 permite hasta el 3. El día 31 permite todo el mes.
- Al terminar octubre, toda la edición permanece disponible. No se reinicia al cambiar de mes o de año.
- Se revisa la fecha cada 15 segundos y al volver a la pestaña. Cambiar de edición separa el progreso por año.
- Reveladas y vistas se guardan en `localStorage` en este navegador. No se sincronizan entre dispositivos. El botón de película vista permite desmarcarla. La sincronización entre pestañas del mismo navegador es automática.
- Si el navegador impide guardar o elimina sus datos, el progreso no será persistente. La aplicación avisa si no puede guardar y continúa en memoria.
- Las casillas futuras no contienen títulos, sinopsis ni pistas temáticas en la interfaz ni en sus etiquetas accesibles. El modal se elimina al cerrarlo.

El bloqueo es una sorpresa de interfaz, **no una protección de seguridad**. La lista está en el JavaScript descargado y la fecha depende del reloj del dispositivo. Un usuario técnico puede inspeccionar los archivos o modificar la hora. Para ocultar de verdad las películas futuras harían falta un servidor con fecha confiable y entrega de datos por día.

Las tarjetas incluyen carteles descargados de las fichas de Wikipedia, con un enlace a los créditos de cada imagen. Solo se carga el cartel de la película abierta; no se muestran imágenes de días futuros. Si una imagen falla, se conserva una ilustración temática como alternativa. Los carteles pertenecen a sus respectivos titulares; la procedencia queda registrada, sin atribuirles una licencia general de reutilización.

Para los títulos con múltiples versiones se seleccionaron: Frankenstein (1931), The Haunted Mansion (2003), Ghostbusters (1984), Scooby-Doo (2002), The Phantom of the Opera (2004), Frankenweenie (2012), Scream (1996) y The Addams Family (1991). Los años se muestran en las tarjetas y pueden ajustarse en `src/posters.js` junto con la imagen. No se incluyen plataformas de streaming.

Las descripciones y los dibujos son originales. Los carteles se sirven localmente: las únicas solicitudes externas al usar la página son las tipografías de Google Fonts y los enlaces de créditos si se abren. Para volver a obtener los carteles se puede ejecutar `node scripts/fetch-posters.mjs`, que consulta Wikipedia y descarga las imágenes de manera secuencial.
