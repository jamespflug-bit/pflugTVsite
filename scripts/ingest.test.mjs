import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from './csv.mjs';
import { buildDataset } from './transform.mjs';
import { htmlToText, postImages, toCsvLine, appendRows, rowFromExtraction, COLUMNS } from './ingest.mjs';

const post = {
  date: '2026-09-20T14:03:00',
  link: 'https://pflugtv.com/2026/09/20/sofi/',
  jetpack_featured_media_url: 'https://pflugtv.com/wp-content/uploads/2026/09/compound.jpg',
  content: { rendered: '<p>Walked the <strong>broadcast compound</strong> at SoFi&nbsp;Stadium &amp; met the crew.</p><figure><img src="https://i0.wp.com/pflugtv.com/a.jpg?w=1024&amp;ssl=1" /></figure>' },
};
const extraction = {
  is_facility_visit: true, name: 'SoFi Stadium', company: 'Hollywood Park', category: 'Stadium & Arena',
  city: 'Inglewood', region: 'CA', country: 'USA', visited: '', description: 'Walked the broadcast compound, "TV row" included.',
  visibility: 'public', public_label: 'should be dropped', geocode_queries: [], reviewer_notes: '',
};

test('htmlToText strips tags and decodes entities', () => {
  assert.equal(htmlToText(post.content.rendered), 'Walked the broadcast compound at SoFi Stadium & met the crew.');
});

test('postImages collects featured and inline images, deduped', () => {
  assert.deepEqual(postImages(post), [
    'https://pflugtv.com/wp-content/uploads/2026/09/compound.jpg',
    'https://i0.wp.com/pflugtv.com/a.jpg?w=1024&ssl=1',
  ]);
});

test('rows round-trip through the CSV and pass validation', () => {
  const row = rowFromExtraction(post, extraction, { lat: 33.95346, lng: -118.33905 });
  assert.equal(row.visited, '2026-09-20');
  assert.equal(row.public_label, '');
  assert.equal(row.lat, '33.9535');
  const csv = appendRows(COLUMNS.join(',') + '\n', [row]);
  const [parsed] = parseCsv(csv);
  assert.equal(parsed.description, extraction.description);
  assert.equal(parsed.link, post.link);
  assert.deepEqual(buildDataset(parseCsv(csv)).errors, []);
});

test('rows without coordinates fail validation so they cannot be published by accident', () => {
  const csv = appendRows(COLUMNS.join(','), [rowFromExtraction(post, extraction, null)]);
  assert.ok(buildDataset(parseCsv(csv)).errors.some((e) => e.includes('missing "lat"')));
});

test('appendRows leaves existing text untouched and quotes when needed', () => {
  assert.equal(appendRows('a\n', []), 'a\n');
  assert.ok(toCsvLine({ name: 'A, "B"' }).startsWith('"A, ""B"""'));
});

test('facility types are the fixed filter list', async () => {
  const { FACILITY_TYPES } = await import('./ingest.mjs');
  assert.deepEqual(FACILITY_TYPES, ['Broadcast Center', 'Stadium & Arena', 'TV Production Studio', 'Network Operations Centers', 'Data Center', 'Corporate Centers']);
});
