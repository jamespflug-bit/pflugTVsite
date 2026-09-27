import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from './csv.mjs';
import { buildDataset } from './transform.mjs';

const csv = (body) => parseCsv('name,company,category,city,region,country,lat,lng,visited,description,link,visibility,public_label\n' + body);

test('parses quoted fields with commas, quotes and newlines', () => {
  const [row] = csv('"Plant, ""North""",Acme,Energy,Austin,TX,USA,30.2,-97.7,2024,"line1\nline2",,,\n');
  assert.equal(row.name, 'Plant, "North"');
  assert.equal(row.description, 'line1\nline2');
});

test('drops hidden rows and anonymises confidential ones', () => {
  const { errors, dataset } = buildDataset(csv(
    'Open Site,Acme,Energy,Austin,TX,USA,30.2672,-97.7431,2024-05,Tour,https://x.com,public,\n' +
    'Secret Fab,MegaCorp,Semiconductor,Phoenix,AZ,USA,33.4484,-112.0740,2023,Top secret,https://y.com,anonymous,Leading-edge chip fab\n' +
    'Private Site,Nope,Energy,Denver,CO,USA,39.7,-104.9,2022,,,hidden,\n'
  ));
  assert.deepEqual(errors, []);
  assert.equal(dataset.facilities.length, 2);
  const anon = dataset.facilities.find((f) => f.confidential);
  assert.equal(anon.name, 'Leading-edge chip fab');
  assert.equal(anon.lat, 33.4);
  assert.equal(anon.lng, -112.1);
  for (const key of ['company', 'description', 'link']) assert.equal(key in anon, false);
  assert.equal(JSON.stringify(dataset).includes('MegaCorp'), false);
  assert.equal(JSON.stringify(dataset).includes('Private Site'), false);
  assert.equal(dataset.stats.countries, 1);
  assert.equal(dataset.stats.regions, 2);
});

test('reports bad rows with line numbers', () => {
  const { errors } = buildDataset(csv('Bad,,Energy,,,USA,200,abc,May 2024,,ftp://x,secret,\n,,,,,,,,,,,,x\n'));
  assert.ok(errors.some((e) => e.startsWith('line 2') && e.includes('lat')));
  assert.ok(errors.some((e) => e.includes('lng')));
  assert.ok(errors.some((e) => e.includes('visited')));
  assert.ok(errors.some((e) => e.includes('link')));
  assert.ok(errors.some((e) => e.includes('visibility')));
  assert.ok(errors.some((e) => e.startsWith('line 3') && e.includes('missing "name"')));
});
