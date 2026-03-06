# Configuration

Ode uses a `config.yaml` file in `public/` to customize your site. This document covers all available options.

## Site Settings

```yaml
site:
  title: "My Ode"           # Site title
  author: "Your Name"       # Author name
  tagline: "A tagline."     # Short tagline
  url: "https://example.com" # Production URL (used for RSS/sitemap)
  description: "Site description for SEO."
```

## Theme

```yaml
theme: journal  # Built-in theme name (journal, comic, doodle, etc.)
```

See [THEMING.md](THEMING.md) for full theming documentation.

## UI Labels

```yaml
ui:
  labels:
    home: "Home"
    previous: "Previous"
    next: "Next"
    noContent: "No pieces found in this collection."
    errorLoading: "Error loading content."
    page: "Page"
    of: "of"
    volumes: "Reader"
    dawn: "Dawn"
    dusk: "Dusk"
    lightMode: "Switch to light mode"
    darkMode: "Switch to dark mode"
    randomPiece: "Random Piece"
    new: "New"
    rss: "RSS Feed"
    close: "Close"
  lowercase: false  # Make all labels lowercase
  wordsWasted: "{words} words wasted across {pieces} pieces."
```

## Pages

```yaml
pages:
  order:
    - about     # Order pages appear in navigation
    - contact
  notFound: obscured  # Slug of custom 404 page
```

## Exclusions

```yaml
exclude:
  pages:
    - draft-page   # Hide pages by slug
  pieces:
    - wip-piece    # Hide pieces by slug
```

## Reader Mode

Reader mode paginates content to fit in a two-column book layout. Configuration controls how content is chunked into pages.

### Basic Options

```yaml
reader:
  columns: 2                # 1 or 2 columns (default: 2)
  linesPerPage: 37          # Direct override (optional)
  order:
    default: descending     # "ascending" or "descending"
```

### Pagination Calculation

If `linesPerPage` is not set, it's calculated from these parameters:

```yaml
reader:
  pagination:
    columnWidth: 330        # px - width of each column
    columnHeight: 540       # px - height (75vh at 720p)
    lineHeight: 24          # px - line height
    avgCharWidth: 8         # px - average character width
    safetyMargin: 0.85      # 0-1 - buffer for overflow prevention
```

**Calculation:**
```
charsPerLine = columnWidth / (avgCharWidth × themeScale)
linesPerColumn = columnHeight / (lineHeight × themeScale)
linesPerPage = linesPerColumn × columns × safetyMargin
```

With defaults (scale=1):
- charsPerLine = 330/8 = 41
- linesPerColumn = 540/24 = 22  
- linesPerPage = 22 × 2 × 0.85 = 37

### Troubleshooting

**Content gets cut off?**
- Lower `linesPerPage` (e.g., 30)
- Or increase `safetyMargin` (e.g., 0.75)

**Too many pages?**
- Increase `linesPerPage` (e.g., 44)
- Or decrease `safetyMargin` (e.g., 0.9)

**Using a custom theme with larger font?**
- Theme `scale` is automatically applied
- Or manually set `linesPerPage` to override

## RSS Feed

```yaml
rss:
  piecesLimit: 10  # Number of pieces in RSS feed
```

## Body of Work

Auto-generated archive page of all pieces.

```yaml
bodyOfWork:
  title: "Body of Work"
  slug: "body-of-work"
  order: descending  # "ascending" or "descending"
  description: "A chronological archive of all writings."
```

## Example Full Config

```yaml
site:
  title: "My Ode"
  author: "Jane Doe"
  tagline: "Words, wasted."
  url: "https://my-ode.example.com"
  description: "A personal writing space."

theme: journal

ui:
  labels:
    volumes: "Library"
  lowercase: true
  wordsWasted: "{words} words across {pieces} pieces."

pages:
  order:
    - about
    - body-of-work
  notFound: obscured

exclude:
  pieces:
    - draft-post

reader:
  columns: 2
  linesPerPage: 37
  order:
    default: descending

rss:
  piecesLimit: 20

bodyOfWork:
  title: "Archive"
  slug: "archive"
  order: ascending
```
