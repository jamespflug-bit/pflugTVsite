# PflugTV Travel Map

A public, interactive map of the facilities PflugTV has visited, built to sit
alongside [pflugtv.com](https://pflugtv.com/about/) as a credibility piece.

- Clustered pins coloured by industry, with a popup for each site
- Headline stats: facilities, countries, regions, industries, "since" year
- Search and industry filters, plus a list that flies the map to each site
- Handles confidential visits: NDA sites can show as anonymous pins, or be left off entirely
- Light and dark themes, works on phones, and can be embedded with an iframe
- No build tools or API keys. Plain HTML/JS with Leaflet vendored in `public/vendor/`

## Maintaining the list

Everything comes from **`data/facilities.csv`**. Edit it in Excel, Google
Sheets (File → Download → CSV) or directly on GitHub. The rows in it now are
`EXAMPLE` placeholders, so replace them with your real visits.

| Column | Required | Notes |
|---|---|---|
| `name` | ✔ | Facility name as shown on the map |
| `company` | | Operator / owner |
| `category` | ✔ | Industry label, e.g. `Energy`, `Manufacturing`. Each distinct value becomes a filter chip and colour |
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

## Publishing

`.github/workflows/deploy.yml` validates, builds and deploys `public/` to
GitHub Pages on every push to `main`. One-time setup: **Settings → Pages →
Source: GitHub Actions**. The map will then be live at
`https://jamespflug-bit.github.io/pflugTVsite/`. You can point a subdomain
such as `map.pflugtv.com` at it under Settings → Pages → Custom domain.

Any other static host (Netlify, Cloudflare Pages, your own web server) also
works: run `npm run build` and upload the `public/` folder.

### Embedding on pflugtv.com

Add a Custom HTML block (WordPress) or an embed/code block (Squarespace, Wix)
to a page:

```html
<iframe src="https://jamespflug-bit.github.io/pflugTVsite/?embed=1"
        title="PflugTV travel map" loading="lazy"
        style="width:100%;height:780px;border:0;border-radius:10px"></iframe>
```

URL options:
- `?embed=1` hides the page title, since your site provides its own heading
- `?theme=light` or `?theme=dark` forces a theme. By default it follows the visitor's system setting

## Branding

Colours and font are CSS variables at the top of `public/map.css` (`--accent`
colours the clusters and links). The heading text is in `public/index.html`.
Map tiles are CARTO's free basemaps (`TILES` in `public/map.js`). They're fine
for a personal site's traffic. For heavy traffic, switch to a keyed provider
such as MapTiler or Stadia.
