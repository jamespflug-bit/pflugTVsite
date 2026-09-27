# PflugTV Travel Map

A public, interactive map of the facilities PflugTV has visited, built to sit
alongside [pflugtv.com](https://pflugtv.com/about/) as a credibility piece.

- Clustered pins coloured by industry, with a popup for each site
- Headline stats: facilities, countries, regions, industries, "since" year
- Search and industry filters, plus a list that flies the map to each site
- Handles confidential visits: NDA sites can show as anonymous pins, or be left off entirely
- Styled to match pflugtv.com, and works on phones
- Post a visit to your blog and it lands on the map after you approve it (see below)
- The map itself is plain HTML/JS with Leaflet in `public/vendor/`, with no build tools or API keys

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

## Posting a visit from your blog

The easiest way to add a visit is to post about it on pflugtv.com:

1. In the WordPress app, write a quick post in the **On Location** category.
   A photo and a line or two are enough, e.g. "Walked the TV compound at
   SoFi Stadium for the season opener". Say "under NDA" or "confidential" in
   the text if the client or site shouldn't be named, and it will be added
   as an anonymous pin.
2. Within the hour, `.github/workflows/ingest.yml` picks the post up. Claude
   reads the text and photos to fill in the facility name, type, place and
   date, and OpenStreetMap supplies the coordinates.
3. You get a pull request, **"New visits from pflugtv.com"**, listing each
   visit with a link to check its pin and anything worth double-checking.
   New posts are added to the same PR until you merge it.
4. Review it in the GitHub app. Edit `data/facilities.csv` on the PR branch
   if anything needs changing, then tap **Merge**. The map updates about a
   minute later, and each pin links to its blog post.

### Fastest route: Google Photos → email

For posting many past visits quickly, use WordPress.com's **Post by Email**.
Turn it on once under Settings → Writing → Post by Email, which gives you a
secret `…@post.wordpress.com` address. Save it as a phone contact, e.g.
"Map Post". Keep it private, because anyone with it can publish to the blog.
Then, for each visit:

1. In Google Photos, open the photo → **Share** → Gmail (or any mail app) →
   send to **Map Post**.
2. **Subject:** the facility, e.g. `NHK Broadcast Center, Tokyo`. This
   becomes the post title.
3. **Body:** the category code plus a line or two, **including the year**:

   ```
   [category On Location]
   March 2004. Helped commission the new HD master control.
   ```

The post publishes right away with the photo. The importer picks it up
within the hour and uses the year from the text, since WordPress strips the
photo's own date. Add `[status draft]` to hold a post back for editing
first. Drafts aren't imported until you publish them.

Posts that don't read like a facility visit are recorded in
`data/ingest-skip.txt` instead, so they aren't processed again. Each new
post costs a few cents of Claude usage. Hourly checks with nothing new are
free.

One-time setup:
- Create an **On Location** category on the blog (slug `on-location`).
- Create an API key at [console.anthropic.com](https://console.anthropic.com/)
  and add it as a repository secret named `ANTHROPIC_API_KEY`
  (Settings → Secrets and variables → Actions).
- Settings → Actions → General → Workflow permissions: tick **Allow GitHub
  Actions to create and approve pull requests**.
- To test it without waiting for the hour, go to Actions → "Import visits
  from blog" → **Run workflow**.

## Run locally

Requires Node 18+. The map needs nothing installed. Run `npm install` only if you want to run the blog importer locally.

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

The basemap is [OpenFreeMap](https://openfreemap.org/)'s "Positron" style,
drawn with MapLibre GL. It's free, with no API key or usage limits. If the
visitor's browser can't render it (no WebGL) or OpenFreeMap is down, the map
falls back to standard OpenStreetMap tiles. Both are set up in `addBasemap()`
in `public/map.js`.
