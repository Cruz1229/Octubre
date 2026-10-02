import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { movies } from '../src/movies.js';

// Versiones identificadas para evitar confundir secuelas y remakes.
const pages = [
  ['The Nightmare Before Christmas', 1993], ['Hocus Pocus 2', 2022], ['Coraline (film)', 2009],
  ['Ghostbusters', 1984], ['Halloweentown (film)', 1998], ['Hocus Pocus (1993 film)', 1993],
  ['Monster House (film)', 2006], ['The Haunted Mansion (2003 film)', 2003], ['Edward Scissorhands', 1990],
  ['ParaNorman', 2012], ['Twitches Too', 2007], ['Van Helsing (film)', 2004],
  ['The Spiderwick Chronicles (film)', 2008], ['Frankenstein (1931 film)', 1931], ['Girl vs. Monster', 2012],
  ['Scooby-Doo (film)', 2002], ['The Phantom of the Opera (2004 film)', 2004], ['Frankenweenie (2012 film)', 2012],
  ['Corpse Bride', 2005], ['Hubie Halloween', 2020], ['Sleepy Hollow (film)', 1999], ['Casper (film)', 1995],
  ["Miss Peregrine's Home for Peculiar Children (film)", 2016], ['Scream (1996 film)', 1996],
  ["Pan's Labyrinth", 2006], ["Jennifer's Body", 2009], ['Beetlejuice', 1988], ['The Addams Family (1991 film)', 1991],
  ['Halloweentown High', 2004], ['Ghostbusters: Afterlife', 2021], ['Coco (2017 film)', 2017],
];
const headers = { 'User-Agent': 'NuestroOctubreLocal/1.0 (personal movie calendar; poster attribution included)' };
const root = new URL('../', import.meta.url);
await mkdir(new URL('assets/posters/', root), { recursive: true });
const query = new URL('https://en.wikipedia.org/w/api.php');
query.search = new URLSearchParams({ action: 'query', titles: pages.map(([title]) => title).join('|'), prop: 'pageimages', piprop: 'original|name', pilicense: 'any', redirects: '1', format: 'json' });
const response = await fetch(query, { headers });
if (!response.ok) throw new Error(`Wikipedia: ${response.status}`);
const metadata = await response.json();
const results = Object.values(metadata.query.pages);
const redirects = metadata.query.redirects || [];
const posters = {};
const credits = [];
for (const [index, [requestedTitle, year]] of pages.entries()) {
  const title = redirects.find(entry => entry.from === requestedTitle)?.to || requestedTitle;
  const page = results.find(result => result.title === title);
  if (!page?.original) throw new Error(`Sin portada: ${requestedTitle}`);
  const url = new URL(page.original.source);
  url.search = '';
  await delay(700);
  let image = await fetch(url, { headers });
  if (image.status === 429) { await delay(15000); image = await fetch(url, { headers }); }
  if (!image.ok || !image.headers.get('content-type')?.startsWith('image/')) throw new Error(`No se pudo descargar ${title}: ${image.status}`);
  const type = image.headers.get('content-type');
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('svg') ? 'svg' : 'jpg';
  const file = `assets/posters/${String(index + 1).padStart(2, '0')}.${ext}`;
  await writeFile(new URL(file, root), new Uint8Array(await image.arrayBuffer()));
  const source = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`;
  const imagePage = `https://en.wikipedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`;
  posters[index + 1] = { src: `./${file}`, year, source, imagePage };
  credits.push({ day: index + 1, title: movies[index].title, year, source, imagePage, imageURL: url.href, localFile: file });
  console.log(`${index + 1}. ${movies[index].title}: ${page.pageimage}`);
}
await writeFile(new URL('src/posters.js', root), `// Portadas obtenidas de las fichas de Wikipedia; procedencia en assets/posters/credits.json.\nexport const posters = ${JSON.stringify(posters, null, 2)};\n`);
await writeFile(new URL('assets/posters/credits.json', root), JSON.stringify({ retrievedOn: '2026-10-02', note: 'Los carteles pertenecen a sus respectivos titulares. Wikipedia es la fuente de consulta, no una licencia general de reutilización.', posters: credits }, null, 2));
