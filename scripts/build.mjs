import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'src', 'assets']) {
  await cp(new URL(entry, root), new URL(entry, output), { recursive: true });
}
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
await writeFile(new URL('build-info.json', output), JSON.stringify({ version: pkg.version, builtAt: new Date().toISOString() }, null, 2));
console.log(`Build listo: ${fileURLToPath(output)}`);
