# PflugTV Travel Map

A public, interactive map of the facilities PflugTV has visited, built to sit
alongside [pflugtv.com](https://pflugtv.com/about/) as a credibility piece.

- Clustered pins coloured by industry, with a popup for each site
- Headline stats: facilities, countries, regions, industries, "since" year
- Search and industry filters, plus a list that flies the map to each site
- Handles confidential visits: NDA sites can show as anonymous pins, or be left off entirely
- Styled to match pflugtv.com, and works on phones
- No build tools or API keys. Plain HTML/JS with Leaflet in `public/vendor/`

## Maintaining the list

Everything comes from **`data/facilities.csv`**. Edit it in Excel, Google
Sheets (File → Download → CSV) or directly on GitHub. The rows in it now are
`EXAMPLE` placeholders, so replace them with your real visits.

| Column | Required | Notes |
|---|---|---|
| `name` | ✔ | Facility name as shown on the map |
| `company` | | Operator / owner |
| `category` | ✔ | Facility type, e.g. `Broadcast Center`, `Stadium & Arena`. Each distinct value becomes a filter chip and colour |
| `city`, `region` | | `region` = state / province (it feeds the Regions count) |
| `country` | ✔ | |
| `lat`, `lng` | ✔ | Decimal degrees. In Google Maps, right-click a spot and click the coordinates to copy them |
| `visited` | | `2024`, `2024-05` or `2024-05-17` |
| `description` | | One or two sentences for the popup |
| `link` | | Video / article URL. Shows a "Watch / read more" link |
| `visibility` | | `public` (default), `anonymous` or `hidden` (see below) |
| `public_label` | | Name shown for anonymous sites, e.g. `Leading-edge semiconductor fab` |

### Confidential sites

- **`public`**: everything is shown at the exact location.
- **`anonymous`**: the pin appears with an "NDA" badge. The name is replaced
  by `public_label` (or "Confidential ‹category› site"), and the company,
  description and link are removed. Coordinates are rounded to about 11 km.
  City, region, country, category and date are still shown.
- **`hidden`**: left out of the published data completely.

This filtering happens in `npm run build`, so the stripped details never reach
the published site. **But `data/facilities.csv` itself is readable by anyone
who can see this repository.** If the repo is public, don't put real NDA
details in it. Either make the repo private (GitHub Pages from a private repo
needs a paid plan) or keep confidential rows vague in the CSV too.

## Run locally

Requires Node 18+. There are no dependencies to install.

```sh
npm run build   # validate the CSV → public/data/facilities.json
npm run serve   # build + preview at http://localhost:8080
npm test
```

If the CSV has a problem (a missing field, a bad coordinate, a typo in
`visibility`), the build stops and names the line.

## Publishing at map.pflugtv.com

pflugtv.com is on WordPress.com Premium, which strips iframes and doesn't
allow plugins. So the map lives on its own subdomain instead. Its header,
font and colours mirror the WordPress theme, and it links back to the main site.

`.github/workflows/deploy.yml` validates, builds and deploys `public/` to
GitHub Pages on every push to `main`.

One-time setup:

1. **GitHub → Settings → General**: set the default branch to `main`.
2. **GitHub → Settings → Pages**: set Source to **GitHub Actions**, then
   set Custom domain to `map.pflugtv.com`. Tick **Enforce HTTPS** once
   the certificate is issued, which takes a few minutes after DNS resolves.
3. **DNS** (WordPress.com → Domains → pflugtv.com → DNS records): add a
   `CNAME` record with name `map` pointing to `jamespflug-bit.github.io`.
4. **WordPress**: add a "Travel Map" link to `https://map.pflugtv.com/` in
   the site navigation (Appearance → Editor → Navigation) and on the About page.

Other options:
- `?theme=dark` gives a dark version.
- `?embed=1` shows only the map, without the header and footer. It's for an
  iframe if you ever move to a WordPress.com Business plan:
  `<iframe src="https://map.pflugtv.com/?embed=1" style="width:100%;height:780px;border:0"></iframe>`

## Branding

Colours are CSS variables at the top of `public/map.css`, copied from the
WordPress theme presets (`--accent` = the theme's purple, `--highlight` = its
yellow). Manrope is self-hosted from `public/fonts/`. The header links, heading
and footer text are in `public/index.html`. If you add pages to the main
site's menu, add them to the header there too.
Map tiles are CARTO's free basemaps (`TILES` in `public/map.js`). They're fine
for a personal site's traffic. For heavy traffic, switch to a keyed provider
such as MapTiler or Stadia.
