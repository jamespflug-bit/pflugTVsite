// Turns the private master list into the public dataset: validates each row,
// drops hidden sites, and strips identifying details from anonymous ones.

export const VISIBILITY = ['public', 'anonymous', 'hidden'];
const REQUIRED = ['name', 'category', 'country', 'lat', 'lng'];

// ~11 km precision, enough to show the region without pinpointing a site.
const roundCoord = (n) => Math.round(n * 10) / 10;

export function validateRow(row) {
  const errors = [];
  for (const key of REQUIRED) if (!row[key]) errors.push(`missing "${key}"`);

  const lat = Number(row.lat);
  const lng = Number(row.lng);
  if (row.lat && (!Number.isFinite(lat) || lat < -90 || lat > 90)) errors.push(`lat "${row.lat}" must be between -90 and 90`);
  if (row.lng && (!Number.isFinite(lng) || lng < -180 || lng > 180)) errors.push(`lng "${row.lng}" must be between -180 and 180`);

  const visibility = (row.visibility || 'public').toLowerCase();
  if (!VISIBILITY.includes(visibility)) errors.push(`visibility "${row.visibility}" must be one of ${VISIBILITY.join(', ')}`);

  if (row.visited && !/^\d{4}(-\d{2})?(-\d{2})?$/.test(row.visited)) errors.push(`visited "${row.visited}" must look like 2024, 2024-05 or 2024-05-17`);
  if (row.link && !/^https?:\/\//i.test(row.link)) errors.push(`link "${row.link}" must start with http:// or https://`);

  return errors;
}

export function toPublicFacility(row) {
  const visibility = (row.visibility || 'public').toLowerCase();
  const base = {
    category: row.category,
    city: row.city || '',
    region: row.region || '',
    country: row.country,
    visited: row.visited || '',
  };

  if (visibility === 'anonymous') {
    return {
      ...base,
      name: row.public_label || `Confidential ${row.category.toLowerCase()} site`,
      confidential: true,
      lat: roundCoord(Number(row.lat)),
      lng: roundCoord(Number(row.lng)),
    };
  }

  return {
    ...base,
    name: row.name,
    company: row.company || '',
    description: row.description || '',
    link: row.link || '',
    confidential: false,
    lat: Number(row.lat),
    lng: Number(row.lng),
  };
}

export function buildDataset(rows) {
  const errors = [];
  for (const row of rows) {
    for (const e of validateRow(row)) errors.push(`line ${row.__line} (${row.name || 'unnamed'}): ${e}`);
  }
  if (errors.length) return { errors };

  const facilities = rows
    .filter((r) => (r.visibility || 'public').toLowerCase() !== 'hidden')
    .map(toPublicFacility)
    .sort((a, b) => (b.visited || '').localeCompare(a.visited || '') || a.name.localeCompare(b.name));

  // Categories ordered by count so the most common get the first palette colours.
  const counts = new Map();
  for (const f of facilities) counts.set(f.category, (counts.get(f.category) || 0) + 1);
  const categories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const unique = (fn) => new Set(facilities.map(fn).filter(Boolean)).size;
  const years = facilities.map((f) => f.visited.slice(0, 4)).filter(Boolean).sort();

  return {
    errors: [],
    dataset: {
      generated: new Date().toISOString(),
      stats: {
        facilities: facilities.length,
        countries: unique((f) => f.country),
        regions: unique((f) => f.region && `${f.country}|${f.region}`),
        categories: categories.length,
        since: years[0] || null,
      },
      categories,
      facilities,
    },
  };
}
