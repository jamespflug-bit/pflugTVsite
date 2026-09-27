// Looks up coordinates for one or more places on OpenStreetMap (Nominatim), for
// adding rows to data/facilities.csv by hand. Run by the "Geocode addresses"
// workflow, or locally: node scripts/geocode.mjs "759 N 19th St, Milwaukee, WI" ...
const USER_AGENT = 'pflugtv-travel-map/1.0 (+https://map.pflugtv.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const queries = process.argv.slice(2).flatMap((a) => a.split(/\s*[\n;]\s*/)).filter(Boolean);
if (!queries.length) {
  console.error('Usage: node scripts/geocode.mjs "place or address" [...]  (separate several with ";")');
  process.exit(1);
}

for (const q of queries) {
  await sleep(1100); // Nominatim usage policy: max 1 request per second
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const [hit] = res.ok ? await res.json() : [];
  console.log(hit
    ? `FOUND  ${Number(hit.lat).toFixed(4)},${Number(hit.lon).toFixed(4)}  ${q}  →  ${hit.display_name}`
    : `MISSING  ${q}`);
}
