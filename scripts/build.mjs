// Reads data/facilities.csv and writes public/data/facilities.json.
// Exits non-zero on validation errors so CI never publishes a broken map.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseCsv } from './csv.mjs';
import { buildDataset } from './transform.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'data', 'facilities.csv');
const output = path.join(root, 'public', 'data', 'facilities.json');

const rows = parseCsv(await readFile(input, 'utf8'));
const { errors, dataset } = buildDataset(rows);

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s) in data/facilities.csv:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(dataset, null, 2) + '\n');

const hidden = rows.length - dataset.facilities.length;
const anon = dataset.facilities.filter((f) => f.confidential).length;
console.log(`✔ ${dataset.facilities.length} facilities published (${anon} anonymous, ${hidden} hidden) → public/data/facilities.json`);
